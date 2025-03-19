"use client";
import React, { useState, useEffect, useMemo } from "react";
import { auth, firestore } from "@/config/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { FaClock, FaSchool } from "react-icons/fa";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

// Interfaces utilisateur et associations
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

// Structure des documents d'horaire d'examens
interface ExamScheduleData {
  schedules: Record<
    string,
    {
      sem1: {
        examDate: string;
        startTime: string;
        endTime: string;
        location?: string;
        examiner?: string;
      };
      sem2: {
        examDate: string;
        startTime: string;
        endTime: string;
        location?: string;
        examiner?: string;
      };
    }
  >;
  classe: string;
}

// Type pour un item d'horaire d'examen
interface ExamScheduleItem {
  classe: string;
  subject: string;
  semester: "sem1" | "sem2";
  examDate: string;
  startTime: string;
  endTime: string;
  location?: string;
  examiner?: string;
}

export default function HoraireExamProf() {
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [associations, setAssociations] = useState<AssociationData[]>([]);
  const [examScheduleItems, setExamScheduleItems] = useState<ExamScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // État pour le filtre de semestre
  const [filterSemester, setFilterSemester] = useState<"all" | "sem1" | "sem2">("all");

  // Récupération des données du professeur
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("Aucun utilisateur connecté");
        const teacherSnap = await getDoc(doc(firestore, "users", user.uid));
        if (!teacherSnap.exists()) throw new Error("Professeur non trouvé");
        setTeacherData(teacherSnap.data() as TeacherData);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchTeacherData();
  }, []);

  // Récupération des associations dans la sous-collection "associations"
  useEffect(() => {
    if (!teacherData?.schoolId) return;
    const fetchAssociations = async () => {
      try {
        const associationsRef = collection(
          firestore,
          "schools",
          teacherData.schoolId,
          "associations"
        );
        const associationsSnap = await getDocs(associationsRef);
        setAssociations(
          associationsSnap.docs.map((doc) => doc.data() as AssociationData)
        );
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchAssociations();
  }, [teacherData]);

  // Récupération des horaires d'examens pour les classes concernées
  useEffect(() => {
    if (!teacherData || associations.length === 0) return;
    const fetchExamSchedules = async () => {
      try {
        // Déterminer pour quelles classes et matières le professeur est concerné
        const teacherAssociations = associations.flatMap((assocDoc) =>
          assocDoc.associations
            .filter(
              (assoc) =>
                assoc.teacher === teacherData.displayName &&
                teacherData.courses?.includes(assoc.subject)
            )
            .map((assoc) => ({ classe: assocDoc.classe, subject: assoc.subject }))
        );
        // Récupérer la liste unique des classes concernées
        const classesToFetch = Array.from(new Set(teacherAssociations.map((a) => a.classe)));

        const examItems: ExamScheduleItem[] = [];

        // Pour chaque classe, récupérer le document d'horaires d'examens
        await Promise.all(
          classesToFetch.map(async (classe) => {
            const examDocRef = doc(
              firestore,
              "schools",
              teacherData.schoolId,
              "examSchedules",
              classe
            );
            const examDocSnap = await getDoc(examDocRef);
            if (!examDocSnap.exists()) return;
            const examData = examDocSnap.data() as ExamScheduleData;
            // Pour chaque matière, vérifier si le professeur est associé
            Object.entries(examData.schedules).forEach(([subject, schedule]) => {
              const isAssociated = teacherAssociations.some(
                (a) => a.classe === classe && a.subject === subject
              );
              // Premier semestre
              if (schedule.sem1.examDate && schedule.sem1.startTime && schedule.sem1.endTime) {
                if (
                  isAssociated ||
                  (schedule.sem1.examiner && schedule.sem1.examiner === teacherData.displayName)
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
                  (schedule.sem2.examiner && schedule.sem2.examiner === teacherData.displayName)
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
        // Tri des items par date et heure
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
        setExamScheduleItems(examItems);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchExamSchedules();
  }, [teacherData, associations]);

  // Filtrage des items selon le semestre sélectionné
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
                    {item.subject} (
                    {item.semester === "sem1" ? "1er Semestre" : "2ème Semestre"})
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
                {item.examiner && (
                  <div className="mt-2 text-sm text-gray-700">
                    <span className="font-medium">Surveillant :</span> {item.examiner}
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
