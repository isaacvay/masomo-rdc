"use client";
import React, { useState, useEffect } from "react";
import { auth, firestore } from "@/config/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { sections } from "@/data/cours";

const colors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-red-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-cyan-500",
  "bg-lime-500",
  "bg-amber-500",
  "bg-fuchsia-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-gray-500",
];

interface TeacherData {
  displayName: string;
  courses?: string[];
  schoolId: string;
  role: string;
}

interface AssociationData {
  associations: {
    subject: string;
    teacher: string;
  }[];
  classe: string;
}

interface OptionsEtClasseFirestoreProps {
  onCourseSelect: (courseName: string, className: string) => void;
}

export default function OptionsEtClasseFirestore({ onCourseSelect }: OptionsEtClasseFirestoreProps) {
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [associations, setAssociations] = useState<AssociationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  // Récupération des données du professeur depuis Firestore
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("Aucun utilisateur connecté");
        const teacherRef = doc(firestore, "users", user.uid);
        const teacherSnap = await getDoc(teacherRef);
        if (!teacherSnap.exists()) throw new Error("Professeur non trouvé");
        setTeacherData(teacherSnap.data() as TeacherData);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchTeacherData();
  }, []);

  // Récupération des associations de classes depuis Firestore (basées sur l'école du prof)
  useEffect(() => {
    const fetchAssociations = async () => {
      if (!teacherData?.schoolId) return;
      try {
        const associationsRef = collection(firestore, "schools", teacherData.schoolId, "associations");
        const associationsSnap = await getDocs(associationsRef);
        setAssociations(associationsSnap.docs.map(doc => doc.data() as AssociationData));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (teacherData) fetchAssociations();
  }, [teacherData]);

  const toggleCategory = (category: string) => {
    setOpenCategory(openCategory === category ? null : category);
  };

  // Fonction utilitaire pour récupérer les infos d'une matière (icône, maxima, catégorie) depuis la constante "sections"
  const getSubjectData = (subjectName: string, classe: string) => {
    for (const section of sections) {
      if (section.classe.includes(classe)) {
        const subject = section.subjects.find(subj => subj.name === subjectName);
        if (subject) return { ...subject, category: section.category };
      }
    }
    return { name: subjectName, icon: "📚", maxima: [], category: "Non définie" };
  };

  // Regroupement des matières par catégorie en se basant sur les associations
  // On ne conserve que les matières dont le nom figure dans teacherData.courses
  // et on ne garde que les classes attribuées au professeur.
  const groupedSubjectsByCategory = associations.reduce((acc, assocDoc) => {
    assocDoc.associations.forEach(assoc => {
      if (
        teacherData &&
        teacherData.displayName === assoc.teacher &&
        teacherData.courses?.includes(assoc.subject)
      ) {
        const subjectData = getSubjectData(assoc.subject, assocDoc.classe);
        const category = subjectData.category;
        if (!acc[category]) {
          acc[category] = {};
        }
        if (!acc[category][assoc.subject]) {
          acc[category][assoc.subject] = {
            ...subjectData,
            classes: [assocDoc.classe],
          };
        } else {
          if (!acc[category][assoc.subject].classes.includes(assocDoc.classe)) {
            acc[category][assoc.subject].classes.push(assocDoc.classe);
          }
        }
      }
    });
    return acc;
  }, {} as Record<
    string,
    Record<
      string,
      { name: string; icon: string; maxima: number[]; classes: string[] }
    >
  >);

  // Conserver uniquement les catégories comportant au moins une matière filtrée
  const categories = Object.keys(groupedSubjectsByCategory).filter(category =>
    Object.keys(groupedSubjectsByCategory[category]).length > 0
  );

  if (loading)
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement en cours...</div>;
  if (error)
    return <div className="min-h-screen flex items-center justify-center text-red-500">Erreur : {error}</div>;
  if (!teacherData)
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Aucune donnée disponible</div>;

  return (
    <div className="max-w-7xl mx-auto p-4">
      {categories.map((category, catIdx) => (
        <div key={catIdx} className="mb-6">
          {/* En-tête de la catégorie */}
          <button
            onClick={() => toggleCategory(category)}
            className={`${colors[catIdx % colors.length]} w-full text-white text-lg font-semibold px-4 py-3 flex justify-between items-center rounded-md`}
          >
            {category}
            <span>{openCategory === category ? "▲" : "▼"}</span>
          </button>
          {openCategory === category && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
              {Object.values(groupedSubjectsByCategory[category]).map(subject => (
                <div
                  key={subject.name}
                  className="bg-white shadow-lg rounded-xl p-4 flex flex-col border border-gray-100 cursor-pointer"
                  onClick={() => onCourseSelect(subject.name, subject.classes[0])}
                >
                  <div className="flex flex-row border-b pb-3">
                    <span className="text-4xl pr-2">{subject.icon}</span>
                    <h3 className="mt-2 text-lg font-semibold">{subject.name}</h3>
                  </div>
                  <div className="mt-3 w-full text-sm text-gray-600">
                    <div className="bg-red-500 text-white px-4 py-1 rounded-md inline-block text-xs">
                      Classe{subject.classes.length > 1 ? "s" : ""}
                    </div>
                    <div className="pl-8">
                      <ul className="mt-2 list-none space-y-1 border-l border-b rounded-bl-lg">
                        {subject.classes.map((cls, idx) => (
                          <li
                            key={idx}
                            className="border-b pl-3 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCourseSelect(subject.name, cls);
                            }}
                          >
                            {cls}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
