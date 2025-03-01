"use client";
import React, { useState, useEffect } from "react";
import { auth, firestore } from "@/config/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { FaChalkboardTeacher, FaUsers } from "react-icons/fa";
import { sections } from "@/data/cours";

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

export default function ListeDesCours() {
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [associations, setAssociations] = useState<AssociationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, []);

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

  const getSubjectData = (subjectName: string, classes: string[]) => {
    for (const section of sections) {
      if (section.classe.some(cl => classes.includes(cl))) {
        const subject = section.subjects?.find(subj => subj.name === subjectName);
        if (subject) return { ...subject, category: section.category };
      }
    }
    return { name: subjectName, icon: "📚", maxima: [], category: "Non définie" };
  };

  const groupedCourses: GroupedCourse[] = associations
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement en cours...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">Erreur : {error}</div>;
  if (!teacherData) return <div className="min-h-screen flex items-center justify-center text-gray-500">Aucune donnée disponible</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2">
          <FaChalkboardTeacher className="text-blue-500" />
          Mes cours attribués
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {groupedCourses.length > 0 ? (
            groupedCourses.map((course, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="p-6 pb-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="bg-blue-100 p-3 rounded-lg text-2xl">{course.icon}</div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">{course.subject}</h2>
                      <span className="text-base text-gray-500">
                        Sections:<strong className="font-bold"> {course.category}</strong>
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">
                          Total annuel: {course.maxima[8] || 'N/A'} pts
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <FaUsers className="text-gray-400" />
                      <span className="font-medium">Classes concernées</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {course.classes.map((classe, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-blue-50 transition-colors">
                          {classe || "Non spécifiée"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="mb-4 text-gray-400"><span className="text-6xl">📚</span></div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun cours attribué</h3>
                <p className="text-gray-500">Vos cours apparaitront ici une fois attribués par l'administration</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
