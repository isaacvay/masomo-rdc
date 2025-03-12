"use client";
import React, { useEffect, useState } from "react";
import { auth, firestore } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { FaSpinner } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ScheduleDay {
  [time: string]: string;
}

interface ScheduleData {
  [day: string]: ScheduleDay;
}

interface UserData {
  schoolId: string;
  classe: string;
  role: string;
}

export default function HoraireDeLEleve() {
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("Utilisateur non connecté");
          return;
        }

        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) throw new Error("Utilisateur introuvable");

        const userData = userDoc.data() as UserData;
        if (userData.role !== "élève") throw new Error("Accès réservé aux élèves");

        const { schoolId, classe } = userData;
        if (!schoolId || !classe) throw new Error("Informations de classe incomplètes");

        const scheduleRef = doc(firestore, "schools", schoolId, "horaires", classe);
        const scheduleDoc = await getDoc(scheduleRef);

        if (!scheduleDoc.exists()) throw new Error("Horaire non trouvé");

        const rawSchedule = scheduleDoc.data().schedule as ScheduleData;
        setSchedule(rawSchedule);
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement de l'horaire");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <FaSpinner className="animate-spin text-blue-600 text-2xl" />
          <span className="text-gray-700 font-medium">Chargement de l'horaire...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-red-500 bg-red-100 rounded-full p-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-800">Indisponible</h3>
          </div>

        </div>
      </div>
    );
  }

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const timeSlots = schedule 
    ? Array.from(new Set(days.flatMap(day => Object.keys(schedule[day] || {}))))
        .sort((a, b) => a.localeCompare(b))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-blue-800 flex items-center space-x-2">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Votre emploi du temps</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-6 py-4 sticky left-0 bg-blue-600 whitespace-nowrap">
                  <span className="lg:pl-2">Heure</span>
                </th>
                {days.map(day => (
                  <th key={day} className="px-6 py-4 text-center">
                    <span className="hidden lg:inline">{day}</span>
                    <span className="lg:hidden">{day.slice(0, 3)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {timeSlots.map(time => (
                <tr key={time} className="hover:bg-gray-50 transition duration-150">
                  <td className="px-6 py-4 sticky left-0 bg-white border-r border-gray-200 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-800">{time}</span>
                    </div>
                  </td>
                  {days.map(day => (
                    <td key={day} className="px-6 py-4 text-center">
                      <div className="text-gray-700 font-medium">
                        {schedule?.[day]?.[time] || (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}