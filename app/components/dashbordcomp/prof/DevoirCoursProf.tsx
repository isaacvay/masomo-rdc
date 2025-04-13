"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { auth, firestore } from "@/config/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { FaChalkboardTeacher, FaUsers, FaInfoCircle, FaSpinner } from "react-icons/fa";
import { sections } from "@/data/cours";
import DevoirProf from "../devoir/DevoirProf";


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

interface GroupedCourse {
  subject: string;
  classes: string[];
  icon: string;
  maxima: number[];
  category: string;
}

interface SelectedCourse {
  subject: string;
  classe: string;
}

export default function DevoirCoursProf() {
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [associations, setAssociations] = useState<AssociationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<SelectedCourse | null>(null);

  const fetchTeacherData = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Aucun utilisateur connecté");

      const teacherRef = doc(firestore, "users", user.uid);
      const teacherSnap = await getDoc(teacherRef);
      
      if (!teacherSnap.exists()) throw new Error("Professeur non trouvé");

      setTeacherData(teacherSnap.data() as TeacherData);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  const fetchAssociations = useCallback(async () => {
    if (!teacherData?.schoolId) return;

    try {
      setLoading(true);
      const associationsRef = collection(firestore, "schools", teacherData.schoolId, "associations");
      const associationsSnap = await getDocs(associationsRef);
      setAssociations(associationsSnap.docs.map(doc => doc.data() as AssociationData));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teacherData?.schoolId]);

  useEffect(() => {
    fetchTeacherData();
  }, [fetchTeacherData]);

  useEffect(() => {
    if (teacherData) {
      fetchAssociations();
    }
  }, [teacherData, fetchAssociations]);

  const getSubjectData = useCallback((subjectName: string, classes: string[]) => {
    for (const section of sections) {
      if (section.classe.some(cl => classes.includes(cl))) {
        const subject = section.subjects?.find(subj => subj.name === subjectName);
        if (subject) return { ...subject, category: section.category };
      }
    }
    return { name: subjectName, icon: "📚", maxima: [], category: "Non définie" };
  }, []);

  const handleClassClick = useCallback((course: GroupedCourse, classe: string) => {
    setSelectedCourse({
      subject: course.subject,
      classe: classe
    });
  }, []);

  const handleBackToCourses = useCallback(() => {
    setSelectedCourse(null);
  }, []);

  const groupedCourses = useMemo(() => {
    return associations
      .flatMap(assocDoc => 
        assocDoc.associations
          .filter(assoc => teacherData?.displayName === assoc.teacher && teacherData?.courses?.includes(assoc.subject))
          .map(assoc => ({ subject: assoc.subject, classe: assocDoc.classe }))
      )
      .reduce((acc, curr) => {
        const existing = acc.find(item => item.subject === curr.subject);
        if (existing) {
          if (!existing.classes.includes(curr.classe)) existing.classes.push(curr.classe);
        } else {
          const subjectData = getSubjectData(curr.subject, [curr.classe]);
          acc.push({ 
            subject: curr.subject, 
            classes: [curr.classe],
            icon: subjectData.icon,
            maxima: subjectData.maxima,
            category: subjectData.category
          });
        }
        return acc;
      }, [] as GroupedCourse[])
      .sort((a, b) => a.subject.localeCompare(b.subject));
  }, [associations, teacherData, getSubjectData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <FaSpinner className="animate-spin mr-2 text-2xl" />
        <span>Chargement en cours...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded max-w-md mx-4">
          <h3 className="font-bold">Erreur</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!teacherData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Aucune donnée disponible
      </div>
    );
  }

  if (selectedCourse) {
    return (
      <DevoirProf 
        cours={selectedCourse.subject} 
        classe={selectedCourse.classe} 
        onBack={handleBackToCourses} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FaChalkboardTeacher className="text-blue-500" />
            Mes cours attribués
          </h1>
          {groupedCourses.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FaInfoCircle />
              <span>Cliquez sur une classe pour gérer les devoirs</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedCourses.length > 0 ? (
            groupedCourses.map((course, index) => (
              <div 
                key={`${course.subject}-${index}`} 
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-xl flex-shrink-0">
                      {course.icon}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 line-clamp-2">
                        {course.subject}
                      </h2>
                      <span className="text-sm text-gray-500">
                        {course.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <FaUsers className="text-gray-400" />
                      <span className="text-sm font-medium">Classes</span>
                    </div>
                    <div className="flex flex-justify-start flex-col gap-2 ">
                      {course.classes.map((classe, idx) => (
                        <button
                          key={`${classe}-${idx}`}
                          onClick={() => handleClassClick(course, classe)}
                          className="px-5 py-3 bg-gray-100 rounded-full text-lg font-semibold text-gray-700 hover:bg-blue-100 transition-colors cursor-pointer"
                          title={`Gérer les devoirs pour ${classe}`}
                        >
                          {classe || "Non spécifiée"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="mb-3 text-gray-300">
                  <span className="text-5xl">📚</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-1">
                  Aucun cours attribué
                </h3>
                <p className="text-gray-500 text-sm">
                  Vos cours apparaîtront ici une fois attribués par l'administration
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
