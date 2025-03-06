"use client";
import React, { useState, useEffect } from "react";
import BulletinAffiche from "./BulletinAffiche";
import { auth, firestore } from "@/config/firebase";
import { collection, doc, getDocs, getDoc, query, where } from "firebase/firestore";
import { ChevronRightIcon } from "lucide-react";

interface Student {
  displayName: string;
  sexe: string;
  neEA: string;
  naissance: string;
  classe: string;
  section: string;
  numPerm: string;
  schoolId: string;
}

interface SchoolInfo {
  province: string;
  ville: string;
  commune: string;
  nom: string;
  code: string;
}

export default function BulletinListeEleve() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [teacherClass, setTeacherClass] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeacherInfo = async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("Aucun utilisateur connecté");

        const teacherDoc = await getDoc(doc(firestore, "users", user.uid));
        if (!teacherDoc.exists()) throw new Error("Utilisateur introuvable");

        const teacherData = teacherDoc.data();
        if (teacherData.role !== "professeur")
          throw new Error("Accès refusé : Vous n'êtes pas un professeur");

        setIsTeacher(true);
        setSchoolId(teacherData.schoolId || null);
      } catch (error: any) {
        setError(error.message);
        setIsTeacher(false);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherInfo();
  }, []);

  useEffect(() => {
    const fetchTeacherClass = async () => {
      if (!schoolId) return;

      try {
        const teacherName = auth.currentUser?.displayName;
        if (!teacherName) throw new Error("Nom du professeur non défini");

        const titulairesRef = collection(doc(firestore, "schools", schoolId), "titulaires");
        const q = query(titulairesRef, where("professeur", "==", teacherName));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setTeacherClass(data.classe || null);
        }
      } catch (error: any) {
        setError("Erreur lors de la récupération de la classe");
      }
    };

    fetchTeacherClass();
  }, [schoolId]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!teacherClass) return;

      try {
        const studentsQuery = query(
          collection(firestore, "users"),
          where("role", "==", "élève"),
          where("classe", "==", teacherClass),
          where("schoolId", "==", schoolId) // Filtrage par école ajouté
        );

        const snapshot = await getDocs(studentsQuery);
        const studentsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            displayName: data.displayName,
            sexe: data.sexe,
            neEA: data.neEA,
            naissance: data.naissance,
            classe: data.classe,
            section: data.section,
            numPerm: data.numPerm,
            schoolId: data.schoolId,
            id: doc.id
          } as Student;
        });
        setStudents(studentsData);
      } catch (error: any) {
        setError("Erreur lors de la récupération des élèves");
      }
    };

    fetchStudents();
  }, [teacherClass]);

  useEffect(() => {
    const fetchSchoolInfo = async () => {
      if (!schoolId) return;

      try {
        const schoolDoc = await getDoc(doc(firestore, "schools", schoolId));
        if (schoolDoc.exists()) {
          setSchool(schoolDoc.data() as SchoolInfo);
        }
      } catch (error: any) {
        setError("Erreur lors de la récupération des informations de l'école");
      }
    };

    fetchSchoolInfo();
  }, [schoolId]);

  if (loading) return <div className="p-4">Chargement...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!isTeacher) return <div className="p-4 text-red-600">Accès refusé</div>;

  const filteredStudents = students.filter(student =>
    student.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedStudent && school) {
    return (
      <div className="p-4">
        <button
          onClick={() => setSelectedStudent(null)}
          className="mb-4 w-full md:w-auto p-2 bg-blue-600 text-white rounded"
        >
          Retour à la liste
        </button>
        <BulletinAffiche selectedStudent={selectedStudent} schoolInfo={school} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 md:p-8 rounded-t-3xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl text-white font-bold mb-2">
                Bulletins des élèves
              </h2>
              <p className="text-slate-200">
                Classe : {teacherClass || "Non définie"}
              </p>
            </div>
            <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Rechercher un élève..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 md:p-4 pl-18 bg-white rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <svg
                className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-4 md:h-5 w-4 md:w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-4">
          <ul className="grid grid-cols-1 gap-4 md:gap-6">
            {filteredStudents.map((student) => (
              <li
                key={student.numPerm}
                className="p-4 bg-white rounded-2xl shadow hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-lg md:text-xl font-semibold">{student.displayName}</p>
                    <p className="text-gray-500">
                      {student.sexe === "M" ? "Garçon" : "Fille"}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedStudent(student)}
                    className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    Afficher le bulletin
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </li>
            ))}
            {filteredStudents.length === 0 && (
              <li className="p-4 text-center text-gray-500">Aucun élève trouvé.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
