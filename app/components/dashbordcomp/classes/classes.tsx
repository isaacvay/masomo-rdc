"use client";
import React, { useState, useEffect } from "react";
import { sections } from "@/data/cours";
import { colors } from "@/data/colors";
import { auth, firestore } from "@/config/firebase";
import { collection, doc, getDocs, query, where } from "firebase/firestore";

interface ClassesDashboardProps {
  onClassSelect: (className: string) => void;
}

interface TitulaireData {
  classe: string;
  professeur: string;
}

interface Student {
  eleve: string;
  classe: string;
  schoolId: string; // Assurez-vous que cette propriété existe dans vos documents utilisateurs
}

export default function ClassesDashboard({ onClassSelect }: ClassesDashboardProps) {
  const [titulaires, setTitulaires] = useState<TitulaireData[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Récupération des titulaires depuis Firestore
  useEffect(() => {
    const fetchTitulaires = async () => {
      try {
        const schoolId = auth.currentUser?.uid;
        if (!schoolId) {
          throw new Error("Aucune école connectée");
        }
        const titulairesRef = collection(doc(firestore, "schools", schoolId), "titulaires");
        const snapshot = await getDocs(titulairesRef);
        const data = snapshot.docs.map((doc) => doc.data() as TitulaireData);
        setTitulaires(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des titulaires :", error);
      }
    };

    fetchTitulaires();
  }, []);

  // Récupération des élèves depuis Firestore en filtrant par école
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const schoolId = auth.currentUser?.uid;
        if (!schoolId) {
          throw new Error("Aucune école connectée");
        }
        const studentsRef = collection(firestore, "users");
        // Filtrer uniquement les élèves de l'école connectée
        const q = query(studentsRef, where("schoolId", "==", schoolId));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => doc.data() as Student);
        setStudents(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des élèves :", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Fusionner les sections par catégorie en regroupant les classes uniques
  const mergedSections = Array.from(
    sections.reduce((map, section) => {
      if (!map.has(section.category)) {
        map.set(section.category, { ...section, classe: new Set(section.classe) });
      } else {
        const existingSection = map.get(section.category);
        section.classe.forEach((cls) => existingSection.classe.add(cls));
      }
      return map;
    }, new Map()).values()
  );

  // Filtrer pour ne conserver que les classes qui comportent au moins un élève
  const filteredSections = mergedSections
    .map((section) => {
      const classesWithStudents = [...section.classe].filter((cls) =>
        students.some((student) => student.classe === cls)
      );
      return { ...section, classe: classesWithStudents };
    })
    .filter((section) => section.classe.length > 0);

  // Fonction pour trouver le titulaire d'une classe (s'il existe)
  const findTitulaireForClass = (className: string): string => {
    const titulaire = titulaires.find((t) => t.classe === className)?.professeur;
    return titulaire || "Non défini";
  };

  if (isLoading) {
    return <div className="text-center py-10 text-gray-600">Chargement des données...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen grid grid-cols-1 md:grid-cols-2 gap-6">
      {filteredSections.map((section, sectionIndex) => (
        <div
          key={sectionIndex}
          className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300"
        >
          <h3 className="text-2xl font-bold mb-4 text-gray-800 uppercase tracking-wide border-b-2 pb-2 border-gray-200">
            {section.category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-200 rounded-xl">
            {section.classe.map((cls: string, clsIndex: number) => (
              <div
                key={clsIndex}
                onClick={() => onClassSelect(cls)}
                className="cursor-pointer bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition transform hover:-translate-y-1 duration-200"
              >
                <div className="p-4">
                  <span
                    className={`block text-white font-bold text-center py-1 px-3 rounded mb-3 ${
                      colors[sectionIndex % colors.length]
                    }`}
                  >
                    {cls}
                  </span>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Titulaire :</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {findTitulaireForClass(cls)}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className="bg-red-100 text-red-700 py-1 px-2 rounded-full text-xs">
                        Cours:{" "}
                        <strong className="ml-1">
                          {sections
                            .filter((sec) => sec.classe.includes(cls))
                            .flatMap((sec) => sec.subjects).length}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
