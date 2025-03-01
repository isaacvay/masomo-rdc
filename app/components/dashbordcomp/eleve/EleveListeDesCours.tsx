"use client";
import React, { useState, useEffect } from "react";
import { auth, firestore } from "@/config/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { sections } from "@/data/cours";

interface StudentData {
  displayName: string;
  schoolId: string;
  classe: string;
  role: string;
}

interface AssociationData {
  associations: {
    subject: string;
    teacher: string;
  }[];
  classe: string;
}

interface CourseWithDetails {
  subject: string;
  icon: string;
  maxima: number[];
  category: string;
  teachers: string[];
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    scientifique: "bg-blue-100 text-blue-800",
    littéraire: "bg-purple-100 text-purple-800",
    technique: "bg-green-100 text-green-800",
    artistique: "bg-pink-100 text-pink-800",
  };
  return colors[category.toLowerCase()] || "bg-gray-100 text-gray-800";
};

export default function EleveListeDesCours() {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [associations, setAssociations] = useState<AssociationData[]>([]);
  const [courses, setCourses] = useState<CourseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("Aucun utilisateur connecté");
        
        const studentRef = doc(firestore, "users", user.uid);
        const studentSnap = await getDoc(studentRef);
        
        if (!studentSnap.exists()) throw new Error("Élève non trouvé");
        setStudentData(studentSnap.data() as StudentData);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStudent();
  }, []);

  useEffect(() => {
    const fetchAssociations = async () => {
      if (!studentData?.schoolId) return;

      try {
        const assocRef = collection(firestore, "schools", studentData.schoolId, "associations");
        const assocSnap = await getDocs(assocRef);
        setAssociations(assocSnap.docs.map(doc => doc.data() as AssociationData));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (studentData) fetchAssociations();
  }, [studentData]);

  useEffect(() => {
    if (!studentData) return;

    const loadCourses = () => {
      const classCourses = sections.flatMap(section => 
        section.classe.includes(studentData.classe)
          ? section.subjects.map(subject => ({
              subject: subject.name,
              icon: subject.icon,
              maxima: subject.maxima,
              category: section.category,
              teachers: []
            }))
          : []
      );

      const classAssociations = associations.filter(a => a.classe === studentData.classe);
      
      const enrichedCourses = classCourses.map(course => ({
        ...course,
        teachers: Array.from(new Set(
          classAssociations.flatMap(a => 
            a.associations
              .filter(assoc => assoc.subject === course.subject)
              .map(assoc => assoc.teacher)
          )
        ))
      }));

      setCourses(enrichedCourses);
    };

    loadCourses();
  }, [studentData, associations]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Chargement en cours...
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center text-red-500">
      Erreur : {error}
    </div>
  );

  if (!studentData) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Aucune donnée disponible
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Mes cours</h1>
        <p className="text-lg text-gray-600">
          Classe : {studentData.classe}
        </p>
      </header>

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, idx) => (
            <article 
              key={idx}
              className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 ease-in-out p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                  getCategoryColor(course.category)
                }`}>
                  {course.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    {course.subject}
                  </h2>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                    getCategoryColor(course.category)
                  }`}>
                    {course.category}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Enseignant{course.teachers.length > 1 ? "s" : ""}
                </h3>
                {course.teachers.length > 0 ? (
                  <ul className="space-y-2">
                    {course.teachers.map((teacher, tIdx) => (
                      <li 
                        key={tIdx}
                        className="flex items-center text-gray-700"
                      >
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        {teacher}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-400 italic">
                    Aucun enseignant attribué
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">
            Aucun cours disponible pour votre classe
          </div>
        </div>
      )}
    </div>
  );
}