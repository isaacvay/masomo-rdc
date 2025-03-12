"use client";
import React, { useState, useEffect } from "react";
import { sections } from "@/data/cours";
import { auth, firestore } from "@/config/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
} from "firebase/firestore";
import { FaArrowLeft } from "react-icons/fa";
import { CalendarDays } from "lucide-react";
import Horaire from "./horaire";

interface ProfesseurData {
  displayName: string;
  courses?: string[];
  schoolId: string;
  role: string;
}

type TeacherOption = {
  id: number;
  name: string;
};

interface CoursProps {
  selectedClass: string | null;
  onRetour: () => void;
}

export default function Cours({ selectedClass, onRetour }: CoursProps) {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<number>(0);
  const [titulaireOptions, setTitulaireOptions] = useState<TeacherOption[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [currentTutor, setCurrentTutor] = useState<string>("");
  const [professeurs, setProfesseurs] = useState<ProfesseurData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeachers, setSelectedTeachers] = useState<Record<string, number>>({});
  const [tutorSearchTerm, setTutorSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showHoraire, setShowHoraire] = useState(false);

  const currentSubjects = selectedClass
    ? sections
        .filter((section) => section.classe.includes(selectedClass))
        .flatMap((section) => section.subjects)
    : [];

  useEffect(() => {
    const fetchSchoolId = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Aucun utilisateur connecté");

        const userDocRef = doc(firestore, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as { schoolId?: string };
          setSchoolId(userData.schoolId || currentUser.uid);
        } else {
          setSchoolId(currentUser.uid);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du schoolId :", error);
      }
    };

    fetchSchoolId();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!schoolId || !selectedClass) return;

      try {
        // Récupération des professeurs
        const profQuery = query(
          collection(firestore, "users"),
          where("schoolId", "==", schoolId),
          where("role", "in", ["prof", "professeur"])
        );

        const profSnapshot = await getDocs(profQuery);
        const professeursData = profSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as (ProfesseurData & { id: string })[];

        const teachers = professeursData.map((prof, index) => ({
          id: index + 1,
          name: prof.displayName,
        }));

        setProfesseurs(professeursData);
        setTeacherOptions(teachers);

        // Chargement des associations existantes
        const associationDocRef = doc(firestore, "schools", schoolId, "associations", selectedClass);
        const associationDoc = await getDoc(associationDocRef);

        if (associationDoc.exists()) {
          const existingAssociations = associationDoc.data().associations;
          interface Association {
            subject: string;
            teacher: string;
          }

          interface TeachersMap {
            [key: string]: number;
          }

          const teachersMap: TeachersMap = (existingAssociations as Association[]).reduce(
            (acc: TeachersMap, curr: Association) => {
              const teacher = teachers.find(t => t.name === curr.teacher);
              if (teacher) acc[curr.subject] = teacher.id;
              return acc;
            },
            {}
          );
          setSelectedTeachers(teachersMap);
        }

        // Récupération du titulaire
        const titulairesRef = collection(doc(firestore, "schools", schoolId), "titulaires");
        const titulairesSnapshot = await getDocs(titulairesRef);
        const titulairesData = titulairesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Array<{ id: string; professeur: string; classe: string }>;

        const tutorData = titulairesData.find(t => t.classe === selectedClass);
        const tutorName = tutorData?.professeur || "";
        setCurrentTutor(tutorName);

        // Filtrage des options de titulaire
        const assignedTeachers = titulairesData
          .filter(t => t.classe !== selectedClass)
          .map(t => t.professeur);

        const availableTitulaires = teachers.filter(
          t => t.name === tutorName || !assignedTeachers.includes(t.name)
        );

        setTitulaireOptions(availableTitulaires);
        setSelectedTutor(availableTitulaires[0]?.id || 0);
        setTutorSearchTerm(tutorName || "");
      } catch (error) {
        console.error("Erreur lors du chargement des données :", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedClass, schoolId]);

  const filteredTitulaireOptions = titulaireOptions.filter(teacher =>
    teacher.name.toLowerCase().includes(tutorSearchTerm.toLowerCase())
  );

  const handleTutorSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTutorSearchTerm(e.target.value);
    setDropdownOpen(true);
  };

  const handleSelectTutor = (teacher: TeacherOption) => {
    setTutorSearchTerm(teacher.name);
    setSelectedTutor(teacher.id);
    setDropdownOpen(false);
  };

  const handleTeacherChange = (subjectName: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeachers({
      ...selectedTeachers,
      [subjectName]: Number(e.target.value),
    });
  };

  const saveAssociations = async () => {
    if (!schoolId) return;

    try {
      const associations = currentSubjects.map(subject => {
        const teacherId = selectedTeachers[subject.name] || 0;
        const teacher = teacherOptions.find(t => t.id === teacherId);
        return {
          subject: subject.name,
          teacher: teacher?.name || "Inconnu",
        };
      });

      const associationDocRef = doc(firestore, "schools", schoolId, "associations", selectedClass!);
      await setDoc(associationDocRef, { classe: selectedClass, associations }, { merge: true });
      alert("Associations sauvegardées !");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement :", error);
      alert("Erreur lors de la sauvegarde");
    }
  };

  const setTitulaire = async () => {
    if (!schoolId) return;

    try {
      const selectedTutorName = titulaireOptions.find(t => t.id === selectedTutor)?.name || "";
      const titulaireDocRef = doc(firestore, "schools", schoolId, "titulaires", selectedClass!);
      await setDoc(titulaireDocRef, { classe: selectedClass, professeur: selectedTutorName });
      setCurrentTutor(selectedTutorName);
      alert("Titulaire mis à jour !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du titulaire :", error);
      alert("Erreur lors de la mise à jour du titulaire");
    }
  };

  const findTeachersForCourse = (courseName: string): TeacherOption[] => {
    if (!professeurs.length) return [];
    return professeurs
      .filter(p => p.courses?.includes(courseName))
      .map(p => teacherOptions.find(t => t.name === p.displayName))
      .filter(Boolean) as TeacherOption[];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-500"></div>
      </div>
    );
  }

  if (!selectedClass) {
    return (
      <div className="text-center py-8 text-gray-500">
        Veuillez sélectionner une classe pour afficher les cours.
      </div>
    );
  }

  // Si showHoraire est activé, on affiche uniquement la page Horaire
  if (showHoraire) {
    return <Horaire selectedClass={selectedClass} onRetour={() => setShowHoraire(false)} />;
  }

  return (
    <div className="max-w-4xl mx-auto mt-5 p-4 bg-white rounded-lg shadow-lg space-y-8">
      <div className="flex justify-between items-center">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          onClick={onRetour}
          aria-label="Retour à la page précédente"
        >
          <FaArrowLeft className="shrink-0" />
          <span>Retour</span>
        </button>
        <button
          className="flex py-2 px-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md"
          onClick={() => setShowHoraire(true)}
        >
          <CalendarDays className="mr-2" />
          <span>Horaire</span>
        </button>
      </div>

      {/* Section Titulaire */}
      <div className="p-6 bg-indigo-50 rounded-lg">
        <h3 className="text-xl font-semibold mb-4 text-indigo-700">
          Titulaire de la classe de {selectedClass}
        </h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              value={tutorSearchTerm}
              onChange={handleTutorSearchChange}
              placeholder="Rechercher un professeur..."
              className="w-full px-4 py-3 border uppercase border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {dropdownOpen && filteredTitulaireOptions.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredTitulaireOptions.map(teacher => (
                  <div
                    key={teacher.id}
                    onClick={() => handleSelectTutor(teacher)}
                    className="px-4 py-3 cursor-pointer hover:bg-indigo-50 uppercase"
                  >
                    {teacher.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={setTitulaire}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            Définir comme titulaire
          </button>
        </div>
        {currentTutor && (
          <div className="mt-4 text-indigo-700">
            Titulaire actuel : <strong className="uppercase">{currentTutor}</strong>
          </div>
        )}
      </div>

      {/* Section Matières */}
      <div className="space-y-6">
        {currentSubjects.map(subject => {
          const eligibleTeachers = findTeachersForCourse(subject.name);
          const selectedTeacherId = selectedTeachers[subject.name];
          const selectedTeacher = teacherOptions.find(t => t.id === selectedTeacherId);
          return (
            <div key={subject.name} className="p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {subject.icon && (
                    <div className="text-2xl text-indigo-500">
                      {subject.icon}
                    </div>
                  )}
                  <h4 className="text-lg font-medium">{subject.name}</h4>
                </div>
                {selectedTeacher && (
                  <div className="text-sm text-gray-600">
                    Enseignant : <strong className="uppercase">{selectedTeacher.name}</strong>
                  </div>
                )}
              </div>
              <select
                value={selectedTeacherId || ''}
                onChange={(e) => handleTeacherChange(subject.name, e)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Sélectionner un professeur</option>
                {eligibleTeachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id} className="uppercase">
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {/* Boutons d'action */}
      <div className="flex justify-end gap-4">
        <button
          onClick={saveAssociations}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
        >
          Enregistrer les modifications
        </button>
        <button
          onClick={() => {}}
          className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
