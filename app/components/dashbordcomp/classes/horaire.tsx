"use client";
import React, { useState, useEffect, useMemo } from "react";
import { FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { auth, firestore } from "@/config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { sections } from "@/data/cours";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface HoraireProps {
  selectedClass: string;
  onRetour: () => void;
}

export default function Horaire({ selectedClass, onRetour }: HoraireProps) {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<Record<string, Record<string, string>>>({});
  const [scheduleType, setScheduleType] = useState<"RD" | "AUTRE">("RD");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const scheduleConfig = useMemo(() => ({
    RD: { start: "07:30", end: "18:30", label: "Horaire RD" },
    AUTRE: { start: "08:00", end: "18:00", label: "Horaire Standard" }
  }), []);

  const timeSlots = useMemo(() => {
    const generateSlots = (start: string, end: string): string[] => {
      const toMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
      };
      
      const fromMinutes = (mins: number) => 
        `${Math.floor(mins/60).toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`;

      const startMin = toMinutes(start);
      const endMin = toMinutes(end);
      const slots = [];
      
      for (let m = startMin; m <= endMin; m += 60) {
        slots.push(fromMinutes(m));
      }
      
      return slots;
    };

    return generateSlots(scheduleConfig[scheduleType].start, scheduleConfig[scheduleType].end);
  }, [scheduleType, scheduleConfig]);

  const currentSubjects = useMemo(() => 
    selectedClass
      ? sections
          .filter(section => section.classe.includes(selectedClass))
          .flatMap(section => section.subjects)
      : []
  , [selectedClass]);

  useEffect(() => {
    const fetchSchoolId = async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");
        
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        const userData = userDoc.data() as { schoolId?: string } || {};
        setSchoolId(userData.schoolId || user.uid);
      } catch (error) {
        console.error("Error fetching school ID:", error);
        toast.error("Erreur lors de la récupération des informations");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSchoolId();
  }, []);

  useEffect(() => {
    const initializeSchedule = () => {
      const initialSchedule: Record<string, Record<string, string>> = {};
      const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
      
      days.forEach(day => {
        initialSchedule[day] = {};
        timeSlots.forEach(time => {
          initialSchedule[day][time] = "";
        });
      });
      
      setScheduleData(initialSchedule);
    };
    
    if (!isLoading) initializeSchedule();
  }, [timeSlots, isLoading]);

  const handleScheduleChange = (day: string, time: string, value: string) => {
    setScheduleData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [time]: value
      }
    }));
  };

  const saveSchedule = async () => {
    if (!schoolId) return toast.error("Identifiant d'école non disponible");
    setIsSaving(true);
    
    try {
      const scheduleRef = doc(firestore, "schools", schoolId, "horaires", selectedClass);
      await setDoc(scheduleRef, { 
        classe: selectedClass,
        schedule: scheduleData,
        updatedAt: new Date()
      }, { merge: true });
      
      toast.success("Horaire sauvegardé avec succès !");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="p-6 flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="p-6 bg-gradient-to-b from-blue-50 to-white rounded-3xl shadow-2xl max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-10 space-x-6">
        <button 
          className="p-4 bg-blue-100 hover:bg-blue-200 rounded-full transition-transform hover:scale-105"
          onClick={onRetour}
          aria-label="Retour"
        >
          <FaArrowLeft className="text-blue-600" size={24} />
        </button>
        
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-blue-800 tracking-wide">
            📅 Horaire - {selectedClass.toUpperCase()}
          </h2>
          <p className="text-sm text-blue-600 mt-1 flex items-center">
            <FaCheckCircle className="mr-2" /> 
            Plage horaire : <span className="font-semibold ml-1">{scheduleConfig[scheduleType].start} → {scheduleConfig[scheduleType].end}</span>
          </p>
        </div>
      </div>

      {/* Schedule Type Selector */}
      <div className="mb-12">
        <div className="flex justify-center space-x-6">
          {Object.entries(scheduleConfig).map(([key, config]) => (
            <button 
              key={key}
              className={`
                px-8 py-4 rounded-2xl transition-all 
                ${scheduleType === key 
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                  : 'bg-white text-blue-600 border-2 border-blue-100 hover:bg-blue-50 hover:shadow'}
              `}
              onClick={() => setScheduleType(key as "RD" | "AUTRE")}
            >
              <span className="font-semibold">{config.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Time Table */}
      <div className="overflow-x-auto rounded-2xl border border-blue-100">
        <table className="min-w-full bg-white">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-6 py-5 text-left sticky left-0 bg-blue-600 z-10">
                <span className="font-bold">Heure</span>
              </th>
              {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"].map(day => (
                <th key={day} className="px-6 py-5 text-left">
                  <span className="font-bold">{day}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {timeSlots.map((time, index) => (
              <tr key={time} className={index % 2 === 0 ? 'bg-blue-50' : 'bg-white'}>
                <td className="px-6 py-5 font-semibold text-blue-800 whitespace-nowrap sticky left-0 bg-white border-r border-blue-100 z-10">
                  {time}
                </td>
                {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"].map(day => (
                  <td key={day} className="px-6 py-5">
                    <select
                      className="w-full px-4 py-3 border border-blue-200 rounded-xl 
                                 focus:outline-none focus:ring-2 focus:ring-blue-300 
                                 bg-white placeholder-blue-300"
                      value={scheduleData[day]?.[time] || ""}
                      onChange={e => handleScheduleChange(day, time, e.target.value)}
                    >
                      <option value="">-- Choix --</option>
                      {currentSubjects.map(subject => (
                        <option 
                          key={subject.name} 
                          value={subject.name}
                          className="py-3 bg-blue-50 hover:bg-blue-100"
                        >
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-12">
        <button
          className="px-10 py-4 bg-gradient-to-r from-green-500 to-green-600 
                     hover:from-green-600 hover:to-green-700 text-white 
                     rounded-xl transition-all transform hover:scale-105 
                     flex items-center space-x-3 shadow-lg"
          onClick={saveSchedule}
          disabled={isSaving}
        >
          {isSaving ? (
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span>Enregistrement...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <FaCheckCircle size={20} />
              <span>Enregistrer l'horaire</span>
            </div>
          )}
        </button>
      </div>

      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="colored"
        style={{ zIndex: 9999 }}
      />
    </div>
  );
}