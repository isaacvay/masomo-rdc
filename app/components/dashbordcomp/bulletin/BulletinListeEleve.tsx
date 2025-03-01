"use client";
import React, { useState, useEffect } from "react";
import BulletinAffiche from "./BulletinAffiche";
import { auth, firestore } from "@/config/firebase";
import { collection, doc, getDocs, getDoc, query, where } from "firebase/firestore";

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
  // Ajoutez d'autres champs si nécessaire
}

export default function BulletinListeEleve() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [teacherClass, setTeacherClass] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [school, setSchool] = useState<SchoolInfo | null>(null);

  // 1. Récupérer le schoolId et vérifier le rôle du professeur depuis "users"
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
        // Utilise le schoolId présent dans le document du professeur
        if (teacherData.schoolId) {
          setSchoolId(teacherData.schoolId);
        } else {
          throw new Error("Le document du professeur ne contient pas de schoolId");
        }
      } catch (error: any) {
        console.error("Erreur lors de la récupération du professeur :", error.message);
      }
    };

    fetchTeacherInfo();
  }, []);

  // 2. Récupérer la classe du professeur via la sous-collection "titulaires" de "schools/{schoolId}"
  useEffect(() => {
    const fetchTeacherClass = async () => {
      try {
        if (!schoolId) return;
        // On utilise le nom du professeur pour filtrer, puisque dans "titulaires"
        // le champ "professeur" est enregistré avec le nom du professeur.
        const teacherName = auth.currentUser?.displayName;
        if (!teacherName) throw new Error("Nom du professeur non défini");
        const titulairesRef = collection(doc(firestore, "schools", schoolId), "titulaires");
        const q = query(titulairesRef, where("professeur", "==", teacherName));
        const snapshot = await getDocs(q);
        if (snapshot.empty)
          throw new Error("Aucun document titulaire trouvé pour ce professeur");
        const data = snapshot.docs[0].data();
        if (!data.classe)
          throw new Error("La classe n'est pas définie dans le document titulaire");
        setTeacherClass(data.classe);
      } catch (error: any) {
        console.error("Erreur lors de la récupération du titulaire :", error.message);
      }
    };

    fetchTeacherClass();
  }, [schoolId]);

  // 3. Récupérer les élèves (dans "users") appartenant à la classe du professeur
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        if (!teacherClass) return;
        const studentsQuery = query(
          collection(firestore, "users"),
          where("role", "==", "élève"),
          where("classe", "==", teacherClass)
        );
        const snapshot = await getDocs(studentsQuery);
        const studentsData: Student[] = snapshot.docs.map((doc) => doc.data() as Student);
        setStudents(studentsData);
      } catch (error: any) {
        console.error("Erreur lors de la récupération des élèves :", error.message);
      }
    };

    fetchStudents();
  }, [teacherClass]);

  // 4. Récupérer les informations de l'école depuis "schools" avec schoolId
  useEffect(() => {
    const fetchSchoolInfo = async () => {
      try {
        if (!schoolId) return;
        const schoolDoc = await getDoc(doc(firestore, "schools", schoolId));
        if (!schoolDoc.exists()) throw new Error("École non trouvée");
        const schoolData = schoolDoc.data() as SchoolInfo;
        setSchool(schoolData);
      } catch (error: any) {
        console.error("Erreur lors de la récupération des informations de l'école :", error.message);
      }
    };

    fetchSchoolInfo();
  }, [schoolId]);

  if (!isTeacher) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-red-600">Accès refusé.</p>
      </div>
    );
  }

  // Filtrage selon le terme de recherche
  const filteredStudents = students.filter((student) =>
    student.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedStudent) {
    if (!school) {
      return <div>Chargement des informations de l'école...</div>;
    }
    return (
      <div>
        <button
          onClick={() => setSelectedStudent(null)}
          className="m-4 p-2 bg-blue-600 text-white rounded"
        >
          Retour à la liste
        </button>
        <BulletinAffiche selectedStudent={selectedStudent} schoolInfo={school} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden">
        {/* En-tête avec barre de recherche */}
        <div className="bg-blue-600 p-4 flex flex-col md:flex-row items-center justify-between">
          <h2 className="text-3xl text-white font-bold mb-2 md:mb-0">
            Liste des élèves de la classe {teacherClass}
          </h2>
          <input
            type="text"
            placeholder="Rechercher un élève..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Liste des élèves */}
        <div className="p-4">
          <ul className="divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <li
                key={student.numPerm}
                className="p-4 cursor-pointer hover:bg-gray-100"
                onClick={() => setSelectedStudent(student)}
              >
                <p className="text-xl font-medium uppercase">{student.displayName}</p>
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
