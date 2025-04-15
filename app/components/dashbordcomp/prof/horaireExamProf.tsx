"use client";
import React, { useState, useEffect, useMemo } from "react";
import { auth, firestore } from "@/config/firebase";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { FaClock, FaSchool } from "react-icons/fa";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

// ---------------------------------------------------------
// Interfaces
// ---------------------------------------------------------
interface TeacherData {
  displayName: string;
  courses?: string[];
  schoolId: string;
  role: string;
}

interface Association {
  subject: string;
  teacher: string;
}

interface AssociationData {
  associations: Association[];
  classe: string;
}

interface ExamScheduleData {
  schedules: Record<
    string,
    {
      sem1: {
        examDate: string;
        startTime: string;
        endTime: string;
        location?: string;
        examiner: string[];
      };
      sem2: {
        examDate: string;
        startTime: string;
        endTime: string;
        location?: string;
        examiner: string[];
      };
    }
  >;
  classe: string;
}

export interface ExamScheduleItem {
  classe: string;
  subject: string;
  semester: "sem1" | "sem2";
  examDate: string;
  startTime: string;
  endTime: string;
  location?: string;
  examiner: string[];
}

// ---------------------------------------------------------
// Composant principal HoraireExamProf
// ---------------------------------------------------------
export default function HoraireExamProf() {
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [associations, setAssociations] = useState<AssociationData[]>([]);
  const [examScheduleItems, setExamScheduleItems] = useState<ExamScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Filtre de semestre
  const [filterSemester, setFilterSemester] = useState<"all" | "sem1" | "sem2">("all");

  // -------------------------------
  // Récupération des données du professeur
  // -------------------------------
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("Aucun utilisateur connecté");
        const teacherDocRef = doc(firestore, "users", user.uid);
        const teacherSnap = await getDoc(teacherDocRef);
        if (!teacherSnap.exists()) throw new Error("Professeur non trouvé");
        const data = teacherSnap.data() as TeacherData;
        console.log("Teacher data récupérée:", data);
        setTeacherData(data);
      } catch (err: any) {
        console.error("Erreur lors de la récupération du professeur:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchTeacherData();
  }, []);

  // -------------------------------
  // Récupération des associations
  // -------------------------------
  useEffect(() => {
    if (!teacherData?.schoolId) return;
    const fetchAssociations = async () => {
      try {
        const associationsRef = collection(firestore, "schools", teacherData.schoolId, "associations");
        const associationsSnap = await getDocs(associationsRef);
        const assocData = associationsSnap.docs.map((doc) => doc.data() as AssociationData);
        console.log("Associations récupérées:", assocData);
        setAssociations(assocData);
      } catch (err: any) {
        console.error("Erreur lors des associations:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchAssociations();
  }, [teacherData]);

  // -------------------------------
  // Récupération des horaires d'examens
  // -------------------------------
  useEffect(() => {
    if (!teacherData || associations.length === 0) return;
    const fetchExamSchedules = async () => {
      try {
        // Filtrage des associations pour le professeur
        const teacherAssociations = associations.flatMap((assocDoc) =>
          assocDoc.associations
            .filter(
              (assoc) =>
                assoc.teacher === teacherData.displayName &&
                teacherData.courses?.includes(assoc.subject)
            )
            .map((assoc) => ({ classe: assocDoc.classe, subject: assoc.subject }))
        );
        console.log("Teacher associations:", teacherAssociations);

        const classesToFetch = Array.from(new Set(teacherAssociations.map((a) => a.classe)));
        console.log("Classes à charger:", classesToFetch);

        const examItems: ExamScheduleItem[] = [];

        await Promise.all(
          classesToFetch.map(async (classe) => {
            const examDocRef = doc(firestore, "schools", teacherData.schoolId, "examSchedules", classe);
            const examDocSnap = await getDoc(examDocRef);
            if (!examDocSnap.exists()) {
              console.warn(`Aucun document d'examens pour la classe ${classe}`);
              return;
            }
            const examData = examDocSnap.data() as ExamScheduleData;
            Object.entries(examData.schedules).forEach(([subject, schedule]) => {
              const isAssociated = teacherAssociations.some(
                (a) => a.classe === classe && a.subject === subject
              );
              // Premier semestre
              if (schedule.sem1.examDate && schedule.sem1.startTime && schedule.sem1.endTime) {
                if (
                  isAssociated ||
                  (schedule.sem1.examiner && schedule.sem1.examiner.includes(teacherData.displayName))
                ) {
                  examItems.push({
                    classe,
                    subject,
                    semester: "sem1",
                    examDate: schedule.sem1.examDate,
                    startTime: schedule.sem1.startTime,
                    endTime: schedule.sem1.endTime,
                    location: schedule.sem1.location,
                    examiner: schedule.sem1.examiner,
                  });
                }
              }
              // Deuxième semestre
              if (schedule.sem2.examDate && schedule.sem2.startTime && schedule.sem2.endTime) {
                if (
                  isAssociated ||
                  (schedule.sem2.examiner && schedule.sem2.examiner.includes(teacherData.displayName))
                ) {
                  examItems.push({
                    classe,
                    subject,
                    semester: "sem2",
                    examDate: schedule.sem2.examDate,
                    startTime: schedule.sem2.startTime,
                    endTime: schedule.sem2.endTime,
                    location: schedule.sem2.location,
                    examiner: schedule.sem2.examiner,
                  });
                }
              }
            });
          })
        );

        // Tri des items par date puis par heure
        examItems.sort((a, b) => {
          const dateA = new Date(a.examDate);
          const dateB = new Date(b.examDate);
          if (dateA.getTime() !== dateB.getTime()) return dateA.getTime() - dateB.getTime();
          const timeToMinutes = (time: string) => {
            const [h, m] = time.split(":").map(Number);
            return h * 60 + m;
          };
          return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
        });
        console.log("Exam schedule items:", examItems);
        setExamScheduleItems(examItems);
        setLoading(false);
      } catch (err: any) {
        console.error("Erreur lors de la récupération des horaires:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchExamSchedules();
  }, [teacherData, associations]);

  // -------------------------------
  // Filtrage par semestre
  // -------------------------------
  const filteredExamItems = useMemo(() => {
    if (filterSemester === "all") return examScheduleItems;
    return examScheduleItems.filter(item => item.semester === filterSemester);
  }, [filterSemester, examScheduleItems]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl">
        Chargement...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 text-2xl">
        {error}
      </div>
    );
  }

  if (filteredExamItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl">
        Aucun horaire d'examen trouvé pour vous.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* En-tête */}
      <header className="mb-6 bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Horaires des Examens</h1>
        {teacherData && (
          <p className="text-gray-600 mt-1">
            Bonjour, <span className="font-semibold">{teacherData.displayName}</span>
          </p>
        )}
      </header>

      {/* Contrôle de filtre par semestre */}
      <div className="mb-6 flex justify-end">
        <select
          value={filterSemester}
          onChange={(e) => setFilterSemester(e.target.value as "all" | "sem1" | "sem2")}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="all">Tous les semestres</option>
          <option value="sem1">1er Semestre</option>
          <option value="sem2">2ème Semestre</option>
        </select>
      </div>

      {/* Liste des examens */}
      <div className="space-y-4">
        {filteredExamItems.map((item, index) => {
          let formattedDate = "";
          try {
            formattedDate = format(parseISO(item.examDate), "EEEE d MMMM yyyy", { locale: fr });
          } catch (e) {
            formattedDate = item.examDate;
          }
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-4 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {item.subject} ({item.semester === "sem1" ? "1er Semestre" : "2ème Semestre"})
                  </h2>
                  <p className="text-xs text-gray-500">Classe : {item.classe}</p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <FaClock className="w-4 h-4 text-blue-600" />
                  <span>
                    {item.startTime} - {item.endTime}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                  <FaSchool className="w-4 h-4 text-blue-600" />
                  <span>{formattedDate}</span>
                </div>
                {item.location && (
                  <div className="mt-2 text-sm text-gray-700">
                    <span className="font-medium">Salle :</span> {item.location}
                  </div>
                )}
                {item.examiner && item.examiner.length > 0 && (
                  <div className="mt-2 text-sm text-gray-700">
                    <span className="font-medium">Surveillants :</span> {item.examiner.join(", ")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
