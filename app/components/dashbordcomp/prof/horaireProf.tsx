"use client";
import React, { useEffect, useState, useMemo } from "react";
import { auth, firestore } from "@/config/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { FaClock, FaSchool } from "react-icons/fa";

// Interfaces (inchangées)
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

interface ScheduleDocData {
  classe: string;
  schedule: {
    [day: string]: {
      [time: string]: string;
    };
  };
}

interface ScheduleItem {
  classe: string;
  day: string;
  time: string;
  subject: string;
}

export default function HoraireProf() {
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [associations, setAssociations] = useState<AssociationData[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupération des données du professeur
  useEffect(() => {
    let isMounted = true;
    const fetchTeacherData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("Aucun utilisateur connecté");
        const teacherRef = doc(firestore, "users", user.uid);
        const teacherSnap = await getDoc(teacherRef);
        if (!teacherSnap.exists()) throw new Error("Professeur non trouvé");
        if (isMounted) {
          setTeacherData(teacherSnap.data() as TeacherData);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };
    fetchTeacherData();
    return () => { isMounted = false; };
  }, []);

  // Récupération des associations
  useEffect(() => {
    let isMounted = true;
    const fetchAssociations = async () => {
      if (!teacherData?.schoolId) return;
      try {
        const associationsRef = collection(
          firestore,
          "schools",
          teacherData.schoolId,
          "associations"
        );
        const associationsSnap = await getDocs(associationsRef);
        if (isMounted) {
          setAssociations(
            associationsSnap.docs.map((doc) => doc.data() as AssociationData)
          );
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };
    fetchAssociations();
    return () => { isMounted = false; };
  }, [teacherData]);

  // Récupération des horaires
  useEffect(() => {
    let isMounted = true;
    const fetchScheduleItems = async () => {
      if (!teacherData?.schoolId || !isMounted) return;
      try {
        // Filtrer les associations pertinentes pour le professeur connecté
        const teacherAssociations = associations.flatMap((assocDoc) =>
          assocDoc.associations
            .filter(
              (assoc) =>
                assoc.teacher === teacherData.displayName &&
                teacherData.courses?.includes(assoc.subject)
            )
            .map((assoc) => ({
              classe: assocDoc.classe,
              subject: assoc.subject,
            }))
        );
        // Récupération parallèle des horaires pour chaque classe concernée
        const classesToFetch = [...new Set(teacherAssociations.map((a) => a.classe))];
        const schedulePromises = classesToFetch.map(async (classe) => {
          try {
            const scheduleRef = doc(
              firestore,
              "schools",
              teacherData.schoolId,
              "horaires",
              classe
            );
            const scheduleSnap = await getDoc(scheduleRef);
            if (!scheduleSnap.exists()) return [];
            const data = scheduleSnap.data() as ScheduleDocData;
            return Object.entries(data.schedule).flatMap(([day, timeslots]) =>
              Object.entries(timeslots)
                .map(([time, subject]) => ({
                  classe,
                  day,
                  time,
                  subject,
                }))
                .filter((item) =>
                  teacherAssociations.some(
                    (a) => a.classe === item.classe && a.subject === item.subject
                  )
                )
            );
          } catch (err) {
            console.error(`Erreur sur la classe ${classe}:`, err);
            return [];
          }
        });
        const results = await Promise.all(schedulePromises);
        const flattened = results.flat();
        const dayOrder = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
        const sorted = flattened.sort((a, b) => {
          const dayCompare = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
          if (dayCompare !== 0) return dayCompare;
          const timeToMinutes = (time: string) => {
            const [h, m] = time.split(":").map(Number);
            return h * 60 + m;
          };
          return timeToMinutes(a.time) - timeToMinutes(b.time);
        });
        if (isMounted) {
          setScheduleItems(sorted);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };
    if (associations.length > 0) fetchScheduleItems();
    return () => { isMounted = false; };
  }, [associations, teacherData]);

  // Groupement par jour avec useMemo
  const groupedSchedule = useMemo(() => {
    return scheduleItems.reduce((acc, item) => {
      acc[item.day] = [...(acc[item.day] || []), item];
      return acc;
    }, {} as Record<string, ScheduleItem[]>);
  }, [scheduleItems]);

  // Ordre des jours (sans Dimanche)
  const daysOrder = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl">
        Chargement...
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 text-2xl">
        {error}
      </div>
    );
  if (scheduleItems.length === 0)
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl">
        Aucun cours programmé
      </div>
    );

  return (
    <div className="min-h-screen  p-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-extrabold text-gray-900">Mon Horaire</h1>
          {teacherData && (
            <p className="mt-4 text-xl text-gray-700">
              Bonjour, <span className="font-semibold">{teacherData.displayName}</span>
            </p>
          )}
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {daysOrder.map((day) => (
            <div key={day} className="bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
              <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-3 px-4">
                <h2 className="text-xl font-bold text-center">{day}</h2>
              </div>
              <div className="flex-1 p-4 space-y-4">
                {groupedSchedule[day] && groupedSchedule[day].length > 0 ? (
                  groupedSchedule[day].map((item, i) => (
                    <div
                      key={i}
                      className="bg-white border-l-4 border-blue-500 p-4 rounded-md shadow hover:shadow-xl transition-all duration-200"
                    >
                      <p className="text-lg font-bold text-blue-900">{item.subject}</p>
                      <div className="mt-2 flex flex-col items-start justify-between text-sm text-gray-700">
                        <div className="flex items-center gap-1">
                          <FaSchool className="text-blue-700" />
                          <span className="font-semibold">{item.classe}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaClock className="text-blue-700" />
                          <span className="font-semibold">{item.time}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 text-sm">Aucun cours</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
