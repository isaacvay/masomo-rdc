"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { auth, firestore } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { FaSpinner, FaRegCalendarAlt, FaPause } from "react-icons/fa";
import { useRouter } from "next/navigation";

// Interfaces et types
type TimeSlot = {
  start: string;
  end: string;
  isBreak?: boolean;
};

type ScheduleData = Record<string, Record<string, string>>;
type SchoolBlock = { start: string; breakStart: string; breakEnd: string; end: string };

// Constantes
const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const LESSON_DURATION = 45;
const TIME_BLOCKS = {
  morning: { start: "07:30", breakStart: "09:15", breakEnd: "10:00", end: "12:15" },
  afternoon: { start: "12:30", breakStart: "15:00", breakEnd: "15:15", end: "17:30" }
};

// Utilitaires
const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const fromMinutes = (mins: number): string => {
  return `${Math.floor(mins / 60).toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`;
};

const generateSlots = (block: SchoolBlock): TimeSlot[] => {
  let current = toMinutes(block.start);
  const slots: TimeSlot[] = [];

  // Créneaux avant la pause
  for (let i = 0; i < 3; i++) {
    slots.push({ start: fromMinutes(current), end: fromMinutes(current + LESSON_DURATION) });
    current += LESSON_DURATION;
  }

  // Pause
  slots.push({ 
    start: block.breakStart, 
    end: block.breakEnd, 
    isBreak: true 
  });

  current = toMinutes(block.breakEnd);
  
  // Créneaux après la pause
  for (let i = 0; i < 3; i++) {
    slots.push({ start: fromMinutes(current), end: fromMinutes(current + LESSON_DURATION) });
    current += LESSON_DURATION;
  }

  return slots;
};

export default function StudentSchedule() {
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePeriod, setActivePeriod] = useState<keyof typeof TIME_BLOCKS>('morning');
  const router = useRouter();

  // Mémoïsation des créneaux horaires
  const timeSlots = useMemo(() => ({
    morning: generateSlots(TIME_BLOCKS.morning),
    afternoon: generateSlots(TIME_BLOCKS.afternoon)
  }), []);

  // Récupération des données
  const fetchSchedule = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Authentication required");
      
      const [userDoc, scheduleDoc] = await Promise.all([
        getDoc(doc(firestore, "users", user.uid)),
        (async () => {
          const userData = (await getDoc(doc(firestore, "users", user.uid))).data();
          if (!userData || userData.role !== "élève") throw new Error("Unauthorized access");
          if (!userData.schoolId || !userData.classe) throw new Error("Missing school information");
          
          return getDoc(doc(firestore, "schools", userData.schoolId, "horaires", userData.classe));
        })()
      ]);

      if (!scheduleDoc.exists()) throw new Error("Schedule not found");
      setSchedule(scheduleDoc.data().schedule);
    } catch (err: any) {
      setError(err.message || "Error loading schedule");
      setTimeout(() => router.push('/login'), 3000);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchSchedule();
    return () => abortController.abort();
  }, [fetchSchedule]);

  // Rendering conditionnel
  if (loading) {
    return (
      <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center space-y-4">
          <FaSpinner className="animate-spin text-blue-600 text-4xl mx-auto" />
          <h3 className="text-xl font-semibold text-gray-800">Chargement en cours...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="max-w-md bg-red-50 rounded-xl p-6 ring-1 ring-red-100">
          <div className="flex gap-3">
            <div className="shrink-0 text-red-600">
              <FaSpinner className="animate-spin w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-red-800">Erreur</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5">
        {/* En-tête */}
        <header className="p-8 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <FaRegCalendarAlt className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Mon Horaire</h1>
              <p className="text-blue-100 mt-1">Programme hebdomadaire</p>
            </div>
          </div>
        </header>

        {/* Contrôles période */}
        <div className="flex justify-center gap-4 my-8 px-4">
          {Object.entries(TIME_BLOCKS).map(([period, block]) => (
            <button
              key={period}
              onClick={() => setActivePeriod(period as keyof typeof TIME_BLOCKS)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activePeriod === period
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:shadow-md"
              }`}
            >
              {period === 'morning' ? '🌞 Matin' : '🌙 Après-midi'}
            </button>
          ))}
        </div>

        {/* Tableau */}
        <div className="p-6">
          <div className="overflow-x-auto rounded-xl ring-1 ring-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="sticky left-0 pl-8 pr-6 py-5 bg-blue-500 text-white text-left text-sm font-semibold ">
                    Horaire
                  </th> 
                  {DAYS.map(day => (
                    <th key={day} className="px-4 py-5 text-center text-sm font-semibold bg-blue-500 text-white">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {timeSlots[activePeriod].map((slot, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-gray-50 ${slot.isBreak ? 'bg-blue-50' : ''}`}
                  >
                    <td className="sticky left-0 pl-8 pr-6 py-4 bg-white font-medium text-gray-900 border-r border-gray-100">
                      <div className="flex items-center gap-2">
                        {slot.isBreak ? (
                          <FaPause className="text-orange-500" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                        {slot.start} - {slot.end}
                      </div>
                    </td>
                    {DAYS.map(day => (
                      <td key={day} className="px-4 py-4 text-center ">
                        {schedule?.[day]?.[slot.start] ? (
                          <span className="inline-block px-3 py-2 font-semibold text-black">
                            {schedule[day][slot.start]}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
