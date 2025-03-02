"use client";
import React, { useState, useEffect } from "react";
import { sections } from "@/data/cours";
import { colors } from "@/data/colors";
import { auth, firestore } from "@/config/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  query,
  where,
} from "firebase/firestore";

// Interface pour les données d'un professeur (dans "users")
interface ProfesseurData {
  displayName: string;
  courses?: string[];
  schoolId: string;
  role: string;
}

// Option de sélection de professeur
type TeacherOption = {
  id: number;
  name: string;
};

interface CoursProps {
  selectedClass: string | null; // Classe sélectionnée
}

export default function Cours({ selectedClass }: CoursProps) {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<number>(0);
  const [selectedTeachers, setSelectedTeachers] = useState<Record<string, number>>({});
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [currentTutor, setCurrentTutor] = useState<string>("");
  const [professeurs, setProfesseurs] = useState<(ProfesseurData & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Récupérer les matières en fonction de la classe sélectionnée
  const currentSubjects = selectedClass
    ? sections
        .filter((section) => section.classe.includes(selectedClass))
        .flatMap((section) => section.subjects)
    : [];

  // 1. Récupérer le schoolId depuis le document utilisateur dans "users"
  useEffect(() => {
    const fetchSchoolId = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Aucun utilisateur connecté");
        const userDocRef = doc(firestore, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as { schoolId?: string };
          // Utiliser le schoolId si présent, sinon utiliser l'UID de l'utilisateur
          setSchoolId(userData.schoolId ? userData.schoolId : currentUser.uid);
        } else {
          setSchoolId(currentUser.uid);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du schoolId :", error);
      }
    };

    fetchSchoolId();
  }, []);

  // 2. Charger les données (professeurs et titulaires) une fois que schoolId et selectedClass sont définis
  useEffect(() => {
    const fetchData = async () => {
      if (!schoolId || !selectedClass) return;
      try {
        // Récupérer les professeurs depuis "users" filtrés par schoolId et rôle
        const profCollectionRef = collection(firestore, "users");
        const profQuery = query(
          profCollectionRef,
          where("schoolId", "==", schoolId),
          where("role", "in", ["prof", "professeur"])
        );
        const profSnapshot = await getDocs(profQuery);
        const professeursData = profSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as (ProfesseurData & { id: string })[];

        // Générer des options de sélection numériques
        const teachers: TeacherOption[] = professeursData.map((prof, index) => ({
          id: index + 1,
          name: prof.displayName,
        }));
        setTeacherOptions(teachers);
        setProfesseurs(professeursData);

        // Récupérer les titulaires depuis la sous-collection "titulaires" dans "schools/{schoolId}"
        const titulairesRef = collection(doc(firestore, "schools", schoolId), "titulaires");
        const titulairesSnapshot = await getDocs(titulairesRef);
        const titulairesData = titulairesSnapshot.docs.map((doc) => doc.data());
        // Déterminer le titulaire pour la classe sélectionnée
        const tutorData = titulairesData.find((t: any) => t.classe === selectedClass);
        const tutorName = tutorData?.professeur || "";
        setCurrentTutor(tutorName);
        const tutorOption = teachers.find((t) => t.name === tutorName);
        setSelectedTutor(tutorOption ? tutorOption.id : (teachers[0]?.id ?? 0));
      } catch (error) {
        console.error("Erreur lors du chargement des données :", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedClass, schoolId]);

  // Gestion du changement du titulaire (dropdown)
  const handleTutorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTutor(Number(e.target.value));
  };

  // Gestion du changement d'un professeur pour une matière donnée
  const handleTeacherChange = (subjectName: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeachers({
      ...selectedTeachers,
      [subjectName]: Number(e.target.value),
    });
  };

  // Enregistrement des associations dans Firestore
  const saveAssociations = async () => {
    const associations = currentSubjects.map((subject) => {
      const teacherId =
        selectedTeachers[subject.name] || findTeachersForCourse(subject.name)[0]?.id || 0;
      const teacher = teacherOptions.find((t) => t.id === teacherId);
      return {
        subject: subject.name,
        teacher: teacher?.name || "Inconnu",
      };
    });

    console.log("Associations à enregistrer :", associations);

    try {
      if (!schoolId) throw new Error("Aucune école connectée");
      await addDoc(collection(doc(firestore, "schools", schoolId), "associations"), {
        classe: selectedClass,
        associations,
      });
      alert("Associations enregistrées avec succès !");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement :", error);
      alert("Une erreur est survenue lors de l'enregistrement.");
    }
  };

  // Mettre à jour le titulaire dans Firestore
  const setTitulaire = async () => {
    const selectedTutorName = teacherOptions.find((t) => t.id === selectedTutor)?.name || "";
    try {
      if (!schoolId) throw new Error("Aucune école connectée");
      await setDoc(doc(firestore, "schools", schoolId, "titulaires", selectedClass!), {
        classe: selectedClass,
        professeur: selectedTutorName,
      });
      setCurrentTutor(selectedTutorName);
      alert("Titulaire enregistré avec succès !");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du titulaire :", error);
      alert("Une erreur est survenue lors de l'enregistrement du titulaire.");
    }
  };

  // Filtrer les professeurs éligibles pour un cours donné selon le champ "courses"
  const findTeachersForCourse = (courseName: string): TeacherOption[] => {
    if (!professeurs.length || !teacherOptions.length) return [];
    const eligibleProfessors = professeurs.filter(
      (p) => p.courses && p.courses.includes(courseName)
    );
    return eligibleProfessors
      .map((p) => teacherOptions.find((t) => t.name === p.displayName))
      .filter(Boolean) as TeacherOption[];
  };

  if (isLoading) {
    return <div className="text-center">Chargement...</div>;
  }

  if (!selectedClass) {
    return (
      <div className="text-2xl font-semibold text-center">
        Veuillez sélectionner une classe pour afficher les cours.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="max-w-6xl my-5 mx-auto p-6 bg-white rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold p-4 rounded-md mb-8 bg-blue-600 text-white">
          Classe : <span>{selectedClass}</span>
        </h1>

        {/* Section Titulaire */}
        <div className="mb-8 border-b-2 border-gray-200 pb-4">
          <div className="flex items-center space-x-2 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800">Titulaire de la classe</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <select
              id="tutor"
              value={selectedTutor}
              onChange={handleTutorChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
            >
              {teacherOptions.map((tutor) => (
                <option key={tutor.id} value={tutor.id}>
                  {tutor.name}
                </option>
              ))}
            </select>
            <button
              onClick={setTitulaire}
              className="w-full sm:w-72 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200"
            >
              Définir comme Titulaire
            </button>
          </div>
          {currentTutor && (
            <p className="mt-2 text-gray-600">
              Titulaire actuel : <strong className="text-black">{currentTutor}</strong>
            </p>
          )}
        </div>

        {/* Section Liste des Matières */}
        <div>
          <div className="flex items-center space-x-2 mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800">Liste des Matières</h2>
          </div>
          <div className="space-y-4 border border-gray-200 rounded-lg shadow-sm p-4 bg-gray-100">
            {currentSubjects.map((subject) => {
              const eligibleTeachers = findTeachersForCourse(subject.name);
              return (
                <div key={subject.name} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center space-x-2">
                    <span role="img" aria-label={subject.name} className="text-xl">
                      {subject.icon}
                    </span>
                    <h3 className="text-lg font-medium text-gray-800 pl-1">{subject.name}</h3>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <select
                      id={`subject-${subject.name}`}
                      value={selectedTeachers[subject.name] || eligibleTeachers[0]?.id || 0}
                      onChange={(e) => handleTeacherChange(subject.name, e)}
                      className="w-full md:w-72 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
                    >
                      {eligibleTeachers.length > 0 ? (
                        eligibleTeachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </option>
                        ))
                      ) : (
                        <option value={0}>Aucun professeur disponible</option>
                      )}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Boutons pour sauvegarder ou annuler */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-6">
          <button
            onClick={saveAssociations}
            className="w-full sm:w-40 bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200"
          >
            Enregistrer
          </button>
          <button
            className="w-full sm:w-40 border border-gray-400 text-black font-semibold py-2 px-4 rounded-md hover:bg-gray-200 transition duration-200"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
