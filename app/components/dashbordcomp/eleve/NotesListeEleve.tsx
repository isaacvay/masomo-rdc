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
  getDoc,
} from "firebase/firestore";
import { Printer } from "lucide-react";

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
  onRetour: () => void;
}

export default function ListeEleve({
  selectedCourse,
  selectedClass = "7ème",
  onRetour,
}: ListeEleveProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<{ [key: string]: string }>({});
  const [search, setSearch] = useState<string>("");
  const [toast, setToast] = useState<string>("");
  const [actionStatus, setActionStatus] = useState<{ [key: string]: ActionStatus }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentMaxima, setCurrentMaxima] = useState<number[]>([]);
  const [schoolUid, setSchoolUid] = useState<string | null>(null);

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

  useEffect(() => {
    const section = sections.find(
      (s) =>
        s.classe.includes(selectedClass) &&
        s.subjects.some((subj) => subj.name === selectedCourse)
    );
    const subject = section?.subjects.find((subj) => subj.name === selectedCourse);
    setCurrentMaxima(subject?.maxima || []);
  }, [selectedCourse, selectedClass]);

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
        console.error("Erreur lors de la récupération des élèves:", error);
        setToast("Erreur lors de la récupération des élèves.");
      } finally {
        setIsLoading(false);
      }
    };
    loadStudents();
  }, [selectedClass, schoolUid]);

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
        const loadedGrades: { [key: string]: string } = {};
        snapshot.docs.forEach((docSnap) => {
          const entry = docSnap.data();
          if (Array.isArray(entry.grades)) {
            entry.grades.forEach((note: any, i: number) => {
              loadedGrades[`${entry.numPerm}-${i}`] = note.toString();
            });
          }
        });
        setGrades(loadedGrades);
      } catch (error) {
        console.error("Erreur lors du chargement des notes:", error);
        setToast("Erreur lors du chargement des notes.");
      }
    };
    loadGrades();
  }, [selectedCourse, selectedClass, schoolUid]);

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

  const handleSave = async (student: Student) => {
    try {
      const studentGrades = Array.from({ length: 6 }, (_, i) =>
        (grades[`${student.numPerm}-${i}`] || "").toString()
      );

      if (studentGrades.every((grade) => grade.trim() === "")) {
        setToast("Impossible d'enregistrer, tous les champs sont vides.");
        setTimeout(() => setToast(""), 3000);
        return;
      }

      if (!schoolUid) {
        throw new Error("Aucune école connectée");
      }
      if (!student.numPerm) {
        throw new Error("L'élève n'a pas de numéro de permis valide");
      }

      setActionStatus((prev) => ({ ...prev, [student.numPerm]: "saving" }));

      const preparedGrades = studentGrades.map((grade) =>
        grade.trim() === "" ? "0" : grade.trim()
      );

      const maximaIndices = [0, 1, 2, 4, 5, 6];
      preparedGrades.forEach((grade, index) => {
        const max = currentMaxima[maximaIndices[index]] || 0;
        if (parseInt(grade, 10) > max) {
          throw new Error(`La note ${grade} dépasse le maximum autorisé de ${max}`);
        }
      });

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
          grades: preparedGrades,
          course: selectedCourse,
          class: selectedClass,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      const interroCollectionRef = collection(
        firestore,
        `schools/${schoolUid}/students/${student.uid}/Interro`
      );

      preparedGrades.slice(0, 2).forEach((grade, idx) => {
        setDoc(
          doc(interroCollectionRef, `${selectedCourse}.period1.test${idx}`),
          {
            value: parseFloat(grade),
            date: new Date(),
            period: 1,
            testNumber: idx,
            course: selectedCourse,
            class: selectedClass,
            studentName: student.displayName,
            studentId: student.uid,
          },
          { merge: true }
        );
      });

      setDoc(
        doc(interroCollectionRef, `${selectedCourse}.period5.exam`),
        {
          value: parseFloat(preparedGrades[2]),
          date: new Date(),
          period: 5,
          testNumber: "exam",
          course: selectedCourse,
          class: selectedClass,
          studentName: student.displayName,
          studentId: student.uid,
        },
        { merge: true }
      );

      preparedGrades.slice(3, 5).forEach((grade, idx) => {
        setDoc(
          doc(interroCollectionRef, `${selectedCourse}.period2.test${idx}`),
          {
            value: parseFloat(grade),
            date: new Date(),
            period: 2,
            testNumber: idx,
            course: selectedCourse,
            class: selectedClass,
            studentName: student.displayName,
            studentId: student.uid,
          },
          { merge: true }
        );
      });

      setDoc(
        doc(interroCollectionRef, `${selectedCourse}.period6.exam`),
        {
          value: parseFloat(preparedGrades[5]),
          date: new Date(),
          period: 6,
          testNumber: "exam",
          course: selectedCourse,
          class: selectedClass,
          studentName: student.displayName,
          studentId: student.uid,
        },
        { merge: true }
      );

      setActionStatus((prev) => ({ ...prev, [student.numPerm]: "saved" }));
      setToast("Sauvegarde réussie");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setActionStatus((prev) => ({ ...prev, [student.numPerm]: "idle" }));
      setToast(error instanceof Error ? error.message : "Erreur lors de la sauvegarde");
    } finally {
      setTimeout(() => setToast(""), 3000);
    }
  };

  const handleSaveAll = async () => {
    try {
      await Promise.all(filteredStudents.map((student) => handleSave(student)));
      setToast("Sauvegarde de tous les élèves réussie");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde globale:", error);
      setToast("Erreur lors de la sauvegarde de tous les élèves");
    } finally {
      setTimeout(() => setToast(""), 3000);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.classe.toLowerCase() === selectedClass.toLowerCase() &&
      student.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

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
        <div className="flex items-center gap-4">
          <button
            onClick={onRetour}
            className="bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-md transition-colors"
          >
            Retour
          </button>
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {selectedCourse} - {selectedClass}
            </h1>
            <p className="text-lg mb-2">Liste d'Élèves</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Rechercher un élève..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-96 p-3 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={handlePrint}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
          >
            <Printer className="w-5 h-5" />
            <span>Imprimer</span>
          </button>
        </div>
      </header>

      {toast && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300 z-50">
          {toast}
        </div>
      )}

<div id="print-table" className="overflow-x-auto">
  <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
    <thead className="bg-blue-600 text-white">
      <tr>
        <th className="py-4 px-6 text-left">Nom | Postnom | Prénom</th>
        <th colSpan={3} className="py-4 px-6 text-center">
          Premier Semestre
        </th>
        <th colSpan={3} className="py-4 px-6 text-center">
          Second Semestre
        </th>
        {/* Ajout de la classe action-column ici */}
        <th className="py-4 px-6 action-column">Actions</th>
      </tr>
      <tr>
        <th className="py-2 px-4 bg-blue-500"></th>
        <th className="py-2 px-4 text-center bg-blue-500">
          <div>1ère P</div>
          <div className="text-sm font-medium">{currentMaxima[0] || null}</div>
        </th>
        <th className="py-2 px-4 text-center bg-blue-500">
          <div>2ème P</div>
          <div className="text-sm font-medium">{currentMaxima[1] || 0}</div>
        </th>
        <th className="py-2 px-4 text-center bg-blue-500">
          <div>Exam</div>
          <div className="text-sm font-medium">{currentMaxima[2] || 0}</div>
        </th>
        <th className="py-2 px-4 text-center bg-blue-500">
          <div>3ème P</div>
          <div className="text-sm font-medium">{currentMaxima[4] || 0}</div>
        </th>
        <th className="py-2 px-4 text-center bg-blue-500">
          <div>4ème P</div>
          <div className="text-sm font-medium">{currentMaxima[5] || 0}</div>
        </th>
        <th className="py-2 px-4 text-center bg-blue-500">
          <div>Exam</div>
          <div className="text-sm font-medium">{currentMaxima[6] || 0}</div>
        </th>
        {/* Ajout de la classe action-column ici */}
        <th className="py-2 px-4 bg-white action-column">
          <button
            onClick={() => handleSaveAll()}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            {Object.values(actionStatus).includes("saving")
              ? "Enregistrer..."
              : "Enregistrer tout"}
          </button>
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {filteredStudents.length ? (
        filteredStudents.map((student) => (
          <tr key={student.numPerm} className="hover:bg-gray-50 transition-colors">
            <td className="py-4 px-6 font-medium uppercase">
              {student.displayName}
            </td>
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
            {/* Ajout de la classe action-column ici */}
            <td className="py-4 px-6 flex flex-col sm:flex-row gap-2 justify-center action-column">
              <button
                onClick={() => handleSave(student)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
                disabled={actionStatus[student.numPerm] === "saving"}
              >
                {actionStatus[student.numPerm] === "saving"
                  ? "Sauvegarde..."
                  : "Sauvegarder"}
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
