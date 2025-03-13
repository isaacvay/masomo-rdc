"use client";
import React, { useEffect, useState } from "react";
import { auth, firestore } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { FaSpinner, FaRegCalendarAlt } from "react-icons/fa";
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

interface Slot {
  start: string;
  end: string;
  isBreak?: boolean;
}

export default function HoraireDeLEleve() {
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const lessonDuration = 45;

  const toMinutes = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const fromMinutes = (mins: number): string => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const generateSlotsForBlock = (block: {
    start: string;
    breakStart: string;
    breakEnd: string;
    end: string;
  }): Slot[] => {
    const slots: Slot[] = [];
    let current = toMinutes(block.start);
    
    for (let i = 0; i < 3; i++) {
      slots.push({
        start: fromMinutes(current),
        end: fromMinutes(current + lessonDuration),
      });
      current += lessonDuration;
    }
    
    slots.push({ start: block.breakStart, end: block.breakEnd, isBreak: true });
    
    current = toMinutes(block.breakEnd);
    for (let i = 0; i < 3; i++) {
      slots.push({
        start: fromMinutes(current),
        end: fromMinutes(current + lessonDuration),
      });
      current += lessonDuration;
    }
    
    return slots;
  };

  const morningBlock = {
    start: "07:30",
    breakStart: "09:15",
    breakEnd: "10:00",
    end: "12:15",
  };

  const afternoonBlock = {
    start: "12:30",
    breakStart: "15:00",
    breakEnd: "15:15",
    end: "17:30",
  };

  const morningSlots = generateSlotsForBlock(morningBlock);
  const afternoonSlots = generateSlotsForBlock(afternoonBlock);
  const [showMorning, setShowMorning] = useState<boolean>(true);

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

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black ring-opacity-5">
        {/* En-tête */}
        <div className="p-8 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <FaRegCalendarAlt className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Emploi du temps</h1>
              <p className="text-blue-100 mt-1">Visualisation de votre programme hebdomadaire</p>
            </div>
          </div>
        </div>

        {/* Contrôles */}
        <div className="flex justify-center gap-4 my-8 px-4">
          {[true, false].map((isMorning) => (
            <button
              key={String(isMorning)}
              onClick={() => setShowMorning(isMorning)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                showMorning === isMorning
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-600 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              }`}
            >
              {isMorning ? (
                <>
                  <span>🌞 Matin</span>
                  <span className="hidden sm:inline">{morningBlock.start} - {morningBlock.end}</span>
                </>
              ) : (
                <>
                  <span>🌙 Après-midi</span>
                  <span className="hidden sm:inline">{afternoonBlock.start} - {afternoonBlock.end}</span>
                </>
              )}
            </button>
          ))}
        </div>

        {/* Tableau */}
        <div className="p-6">
          <div className="overflow-x-auto rounded-xl ring-1 ring-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="sticky left-0 z-20 pl-8 pr-6 py-5 bg-gray-50 text-left text-sm font-semibold text-gray-700">
                    Horaire
                  </th>
                  {days.map((day) => (
                    <th
                      key={day}
                      className="px-4 py-5 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider"
                    >
                      <span className="hidden lg:inline">{day}</span>
                      <span className="lg:hidden">{day.slice(0, 3)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {(showMorning ? morningSlots : afternoonSlots).map((slot, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-gray-50 transition-colors ${
                      slot.isBreak ? 'bg-blue-50 hover:bg-blue-100' : ''
                    }`}
                  >
                    <td className="sticky left-0 z-10 pl-8 pr-6 py-4 bg-white font-medium text-gray-900 whitespace-nowrap border-r border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${slot.isBreak ? 'bg-orange-500' : 'bg-blue-500'}`} />
                        {slot.start} - {slot.end}
                        {slot.isBreak && <span className="ml-2 text-orange-600">⏸️ Pause</span>}
                      </div>
                    </td>
                    {days.map((day) => (
                      <td key={day} className="px-4 py-4 text-center">
                        <div className="text-gray-700 font-medium">
                          {schedule?.[day]?.[slot.start] ? (
                            <span className="inline-block px-3 py-1 bg-blue-100 rounded-full text-blue-800">
                              {schedule[day][slot.start]}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">-</span>
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

      {/* États de chargement */}
      {loading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-4">
            <FaSpinner className="animate-spin text-blue-600 text-4xl mx-auto" />
            <h3 className="text-xl font-semibold text-gray-800">Chargement de l'emploi du temps</h3>
            <p className="text-gray-600">Veuillez patienter...</p>
          </div>
        </div>
      )}

      {/* Gestion des erreurs */}
      {error && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md bg-red-50 rounded-xl p-6 ring-1 ring-red-100">
            <div className="flex gap-3">
              <div className="shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-red-800">Erreur de chargement</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
