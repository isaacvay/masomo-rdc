"use client";
import React, { useState, useEffect } from "react";
import { sections } from "@/data/cours";
import { auth, firestore } from "@/config/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
} from "firebase/firestore";

type Student = {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  schoolId: string;
  classe: string;
  numPerm: string;
};

type ActionStatus = "idle" | "saving" | "saved" | "canceling" | "canceled";

interface ListeEleveProps {
  selectedCourse: string;
  selectedClass?: string;
}

export default function ListeEleve({
  selectedCourse,
  selectedClass = "7ème",
}: ListeEleveProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<{ [key: string]: string }>({});
  const [search, setSearch] = useState<string>("");
  const [toast, setToast] = useState<string>("");
  const [actionStatus, setActionStatus] = useState<{ [key: string]: ActionStatus }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentMaxima, setCurrentMaxima] = useState<number[]>([]);
  const [schoolUid, setSchoolUid] = useState<string | null>(null);

  // Récupération du schoolUid pour un compte professeur
  useEffect(() => {
    const loadSchoolUid = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error("Aucun utilisateur connecté");
        return;
      }
      try {
        const q = query(
          collection(firestore, "users"),
          where("email", "==", currentUser.email),
          where("role", "==", "professeur")
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const profData = snapshot.docs[0].data();
          if (profData.schoolId) {
            setSchoolUid(profData.schoolId);
            return;
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du prof :", error);
      }
      setSchoolUid(currentUser.uid);
    };
    loadSchoolUid();
  }, []);

  // Mise à jour des maxima en fonction du cours et de la classe sélectionnés
  useEffect(() => {
    const section = sections.find(
      (s) =>
        s.classe.includes(selectedClass) &&
        s.subjects.some((subj) => subj.name === selectedCourse)
    );
    const subject = section?.subjects.find((subj) => subj.name === selectedCourse);
    setCurrentMaxima(subject?.maxima || []);
  }, [selectedCourse, selectedClass]);

  // Charger les élèves depuis la collection "users"
  useEffect(() => {
    const loadStudents = async () => {
      if (!schoolUid) return;
      try {
        const usersRef = collection(firestore, "users");
        const qStudents = query(
          usersRef,
          where("role", "==", "élève"),
          where("schoolId", "==", schoolUid),
          where("classe", "==", selectedClass)
        );
        const snapshot = await getDocs(qStudents);
        const data = snapshot.docs.map((doc) => doc.data() as Student);
        setStudents(data);
      } catch (error) {
        console.error(error);
        setToast("Erreur lors de la récupération des élèves.");
      } finally {
        setIsLoading(false);
      }
    };
    loadStudents();
  }, [selectedClass, schoolUid]);

  // Charger les notes depuis la sous-collection "grades" de l'école
  useEffect(() => {
    const loadGrades = async () => {
      if (!schoolUid) return;
      try {
        const gradesRef = collection(firestore, "schools", schoolUid, "grades");
        const qGrades = query(
          gradesRef,
          where("course", "==", selectedCourse),
          where("class", "==", selectedClass)
        );
        const snapshot = await getDocs(qGrades);
        const data = snapshot.docs.map((doc) => doc.data());
        const loadedGrades: { [key: string]: string } = {};
        data.forEach((entry: any) => {
          if (Array.isArray(entry.grades)) {
            entry.grades.forEach((note: string, i: number) => {
              loadedGrades[`${entry.numPerm}-${i}`] = note;
            });
          }
        });
        setGrades(loadedGrades);
      } catch (error) {
        console.error(error);
        setToast("Erreur lors du chargement des notes.");
      }
    };
    loadGrades();
  }, [selectedCourse, selectedClass, schoolUid]);

  // Mise à jour d'une note pour un élève donné
  const handleGradeChange = (numPerm: string, index: number, value: string) => {
    const maximaIndices = [0, 1, 2, 4, 5, 6];
    const max = currentMaxima[maximaIndices[index]] || 0;
    const cleanedValue = value.replace(/[^0-9]/g, "");
    if (cleanedValue && parseInt(cleanedValue, 10) > max) {
      setToast(`La note maximale autorisée est ${max}`);
      setTimeout(() => setToast(""), 3000);
      return;
    }
    const maxLength = max.toString().length;
    const truncatedValue = cleanedValue.slice(0, maxLength);
    setGrades((prev) => ({
      ...prev,
      [`${numPerm}-${index}`]: truncatedValue,
    }));
  };

  // Sauvegarder les notes pour un élève dans la sous-collection "grades" de l'école
  const handleSave = async (student: Student) => {
    const studentGrades = Array.from({ length: 6 }, (_, i) => grades[`${student.numPerm}-${i}`] || "");
    if (studentGrades.every((grade) => grade.trim() === "")) {
      setToast("Impossible d'enregistrer, tous les champs sont vides.");
      setTimeout(() => setToast(""), 3000);
      return;
    }
    setActionStatus((prev) => ({ ...prev, [student.numPerm]: "saving" }));
    try {
      if (!schoolUid) throw new Error("Aucune école connectée");
      const gradeDocRef = doc(
        firestore,
        "schools",
        schoolUid,
        "grades",
        `${student.numPerm}_${selectedCourse}`
      );
      await setDoc(
        gradeDocRef,
        {
          studentName: student.displayName,
          numPerm: student.numPerm,
          grades: studentGrades.map((grade) => grade || "0"),
          course: selectedCourse,
          class: selectedClass,
        },
        { merge: true }
      );
      setActionStatus((prev) => ({ ...prev, [student.numPerm]: "saved" }));
      setToast("Sauvegarde réussie");
    } catch (error) {
      console.error(error);
      setActionStatus((prev) => ({ ...prev, [student.numPerm]: "idle" }));
      setToast("Erreur lors de la sauvegarde");
    } finally {
      setTimeout(() => setToast(""), 3000);
    }
  };

  // Annuler les modifications pour un élève
  const handleCancel = (numPerm: string) => {
    const newGrades = { ...grades };
    for (let i = 0; i < 6; i++) {
      delete newGrades[`${numPerm}-${i}`];
    }
    setGrades(newGrades);
    setActionStatus((prev) => ({ ...prev, [numPerm]: "canceled" }));
    setToast("Modifications annulées");
    setTimeout(() => setToast(""), 3000);
  };

  const filteredStudents = students.filter(
    (student) =>
      student.classe.toLowerCase() === selectedClass.toLowerCase() &&
      student.displayName.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex justify-center items-center">
        Chargement...
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto p-4 sm:p-8">
      <header className="bg-gradient-to-r flex flex-col sm:flex-row items-center justify-between from-blue-500 to-blue-700 text-white rounded-xl shadow-lg p-4 mb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {selectedCourse} - {selectedClass}
          </h1>
          <p className="text-lg mb-2">Liste d'Élèves</p>
        </div>
        <input
          type="text"
          placeholder="Rechercher un élève..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-96 p-3 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </header>

      {toast && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300 z-50">
          {toast}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="py-4 px-6 text-left">Nom | Postnom | Prénom</th>
              <th colSpan={3} className="py-4 px-6 text-center">Premier Semestre</th>
              <th colSpan={3} className="py-4 px-6 text-center">Second Semestre</th>
              <th className="py-4 px-6">Actions</th>
            </tr>
            <tr className="bg-blue-500">
              <th className="py-2 px-4"></th>
              <th className="py-2 px-4 text-center">
                <div>1ère P</div>
                <div className="text-sm font-medium">{currentMaxima[0] || null}</div>
              </th>
              <th className="py-2 px-4 text-center">
                <div>2ème P</div>
                <div className="text-sm font-medium">{currentMaxima[1] || 0}</div>
              </th>
              <th className="py-2 px-4 text-center">
                <div>Exam</div>
                <div className="text-sm font-medium">{currentMaxima[2] || 0}</div>
              </th>
              <th className="py-2 px-4 text-center">
                <div>3ème P</div>
                <div className="text-sm font-medium">{currentMaxima[4] || 0}</div>
              </th>
              <th className="py-2 px-4 text-center">
                <div>4ème P</div>
                <div className="text-sm font-medium">{currentMaxima[5] || 0}</div>
              </th>
              <th className="py-2 px-4 text-center">
                <div>Exam</div>
                <div className="text-sm font-medium">{currentMaxima[6] || 0}</div>
              </th>
              <th className="py-2 px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredStudents.length ? (
              filteredStudents.map((student) => (
                <tr key={student.numPerm} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-medium uppercase">{student.displayName}</td>
                  {[...Array(6).keys()].map((i) => {
                    const maximaIndices = [0, 1, 2, 4, 5, 6];
                    const max = currentMaxima[maximaIndices[i]] || 0;
                    return (
                      <td key={i} className="py-3 px-4 text-center font-semibold">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={grades[`${student.numPerm}-${i}`] || ""}
                          onChange={(e) =>
                            handleGradeChange(student.numPerm, i, e.target.value)
                          }
                          onFocus={() => {
                            if (grades[`${student.numPerm}-${i}`] === "0") {
                              handleGradeChange(student.numPerm, i, "");
                            }
                          }}
                          className="w-16 mx-auto border rounded-md p-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
                          style={{
                            borderColor:
                              grades[`${student.numPerm}-${i}`]?.length >=
                              max.toString().length
                                ? "#ef4444"
                                : "",
                          }}
                          maxLength={max.toString().length}
                        />
                      </td>
                    );
                  })}
                  <td className="py-4 px-6 flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={() => handleSave(student)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
                      disabled={actionStatus[student.numPerm] === "saving"}
                    >
                      {actionStatus[student.numPerm] === "saving"
                        ? "Sauvegarde..."
                        : "Sauvegarder"}
                    </button>
                    <button
                      onClick={() => handleCancel(student.numPerm)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md transition-colors"
                    >
                      Annuler
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center p-4">
                  Aucun élève trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
