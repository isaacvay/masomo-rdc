"use client";
import React, { useState, useEffect } from "react";
import { sections, Section } from "@/data/cours"; // Vos données et interfaces
import { colors } from "@/data/colors";
import { auth, firestore } from "@/config/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

// Interface pour les élèves
interface Student {
  eleve: string;
  classe: string;
  schoolId: string; // Assurez-vous que ce champ existe dans vos documents utilisateurs
}

interface ListeClassesProps {
  onClassSelect: (className: string) => void;
}

// Fonction pour regrouper les sections par catégorie
const groupByCategory = (sections: Section[]) => {
  const grouped: { [key: string]: { category: string; classes: string[] } } = {};
  sections.forEach((section) => {
    if (!grouped[section.category]) {
      grouped[section.category] = {
        category: section.category,
        classes: [],
      };
    }
    section.classe.forEach((classe) => {
      if (!grouped[section.category].classes.includes(classe)) {
        grouped[section.category].classes.push(classe);
      }
    });
  });
  return Object.values(grouped);
};

export default function ListeClasses({ onClassSelect }: ListeClassesProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les élèves depuis Firestore en filtrant par école
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const schoolId = auth.currentUser?.uid;
        if (!schoolId) {
          throw new Error("Aucune école connectée");
        }
        const usersRef = collection(firestore, "users");
        // Filtrer uniquement les élèves de l'école connectée
        const q = query(usersRef, where("schoolId", "==", schoolId));
        const snapshot = await getDocs(q);
        const data: Student[] = snapshot.docs.map((doc) => doc.data() as Student);
        console.log("Données élèves :", data);
        setStudents(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Regrouper les sections par catégorie
  const groupedSections = groupByCategory(sections);

  // Fonction pour calculer le nombre d'élèves dans une classe donnée
  const countStudentsInClass = (className: string) => {
    return students.filter((student) => student.classe === className).length;
  };

  // Filtrer les sections pour ne conserver que les classes avec au moins un élève
  const filteredSections = groupedSections
    .map((section) => ({
      ...section,
      classes: section.classes.filter((classe) => countStudentsInClass(classe) > 0),
    }))
    .filter((section) => section.classes.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex justify-center items-center">
        Chargement...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex justify-center items-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* En-tête */}
      <div className="bg-blue-600 text-white text-2xl text-start font-bold p-4 rounded-md mb-6">
        Liste des Classes
      </div>
      {/* Grille des sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredSections.map((section, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Titre de la section */}
            <div className={`${colors[index]} text-white font-bold p-3 text-center uppercase`}>
              {section.category}
            </div>
            {/* Liste des classes */}
            <div>
              <div className="bg-gray-200 grid grid-cols-2 text-center font-semibold text-sm py-2">
                <span className="text-left pl-8">Classes</span>
                <span className="text-right pr-8">Élèves</span>
              </div>
              <div className="p-4 bg-white bg-[image:linear-gradient(#E4E4E4FF_1px,transparent_1px),linear-gradient(to_right,#E4E4E4FF_1px,transparent_1px)] bg-[size:32px_32px]">
                {section.classes.map((classe, idx) => (
                  <div
                    key={idx}
                    onClick={() => onClassSelect(classe)}
                    className="flex justify-between items-center border border-sky-300 bg-white shadow-md rounded-lg text-sm px-4 py-2 mb-2 hover:bg-gray-100 transition-colors duration-300 cursor-pointer"
                  >
                    <span className="font-medium">{classe}</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-full font-semibold">
                      {countStudentsInClass(classe)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
