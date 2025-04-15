"use client";
import React, { useState, useEffect, useMemo, JSX } from "react";
import { FaArrowLeft, FaCheckCircle, FaClock, FaSun, FaMoon } from "react-icons/fa";
import { auth, firestore } from "@/config/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { sections } from "@/data/cours";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jsPDF } from "jspdf";

interface HoraireProps {
  selectedClass: string;
  onRetour: () => void;
}

interface Slot {
  start: string;
  end: string;
  isBreak?: boolean;
}

interface Block {
  start: string;
  breakStart: string;
  breakEnd: string;
  end: string;
  label: string;
  icon: JSX.Element;
}

type ScheduleType = "RD" | "Custom";

export default function Horaire({ selectedClass, onRetour }: HoraireProps) {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<
    Record<string, Record<string, string>>
  >({});
  const [scheduleType, setScheduleType] = useState<ScheduleType>("RD");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number>(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const lessonDuration = 45; // durée d'un cours en minutes
  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

  // Configuration améliorée avec possibilité d'étendre à d'autres types d'horaires
  const scheduleConfig: Record<ScheduleType, { blocks: Block[]; label: string }> = useMemo(
    () => ({
      RD: {
        blocks: [
          {
            start: "07:30",
            breakStart: "09:45",
            breakEnd: "10:00",
            end: "12:15",
            label: "Matin",
            icon: <FaSun className="mr-2" />
          },
          {
            start: "12:30",
            breakStart: "15:00",
            breakEnd: "15:15",
            end: "17:30",
            label: "Après-midi",
            icon: <FaMoon className="mr-2" />
          },
        ],
        label: "Horaire RD",
      },
      Custom: {
        blocks: [],
        label: "Horaire Custom",
      },
    }),
    []
  );

  // Fonctions utilitaires pour convertir les heures en minutes et inversement
  const toMinutes = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const fromMinutes = (mins: number): string =>
    `${Math.floor(mins / 60)
      .toString()
      .padStart(2, "0")}:${(mins % 60).toString().padStart(2, "0")}`;

  // Génère pour un bloc exactement 3 cours avant la récréation, insère la récréation, puis 3 cours après
  const generateSlotsForBlock = (block: Block): Slot[] => {
    const slots: Slot[] = [];
    let current = toMinutes(block.start);
    
    // 3 cours avant la récréation
    for (let i = 0; i < 3; i++) {
      slots.push({
        start: fromMinutes(current),
        end: fromMinutes(current + lessonDuration),
      });
      current += lessonDuration;
    }
    
    // Créneau récréation
    slots.push({ 
      start: block.breakStart, 
      end: block.breakEnd, 
      isBreak: true 
    });
    
    // 3 cours après la récréation
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

  // On génère uniquement les créneaux du bloc sélectionné (Matin ou Après-midi)
  const timeSlots = useMemo(() => {
    const block = scheduleConfig[scheduleType].blocks[currentBlockIndex];
    return generateSlotsForBlock(block);
  }, [currentBlockIndex, scheduleType, scheduleConfig]);

  const currentSubjects = useMemo(
    () =>
      selectedClass
        ? sections
            .filter((section) => section.classe.includes(selectedClass))
            .flatMap((section) => section.subjects)
        : [],
    [selectedClass]
  );

  // Récupérer l'ID de l'école depuis Firestore
  useEffect(() => {
    const fetchSchoolId = async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");

        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        const userData = (userDoc.data() as { schoolId?: string }) || {};
        
        if (userData.schoolId) {
          setSchoolId(userData.schoolId);
        } else {
          setSchoolId(user.uid);
          console.warn("School ID not found, using user ID as fallback");
        }
        
        // Essayer de récupérer l'horaire existant
        await fetchExistingSchedule(userData.schoolId || user.uid);
      } catch (error) {
        console.error("Error fetching school ID:", error);
        toast.error("Erreur lors de la récupération des informations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchoolId();
  }, [selectedClass]);

  // Récupérer l'horaire existant s'il existe
  const fetchExistingSchedule = async (schoolIdentifier: string) => {
    try {
      const scheduleRef = doc(
        firestore,
        "schools",
        schoolIdentifier,
        "horaires",
        selectedClass
      );
      
      const scheduleDoc = await getDoc(scheduleRef);
      
      if (scheduleDoc.exists()) {
        const data = scheduleDoc.data();
        setScheduleData(data.schedule || {});
        setLastSaved(data.updatedAt?.toDate() || null);
        toast.info("Horaire existant chargé");
      } else {
        initializeSchedule();
      }
    } catch (error) {
      console.error("Error fetching existing schedule:", error);
      initializeSchedule();
    }
  };

  // Initialiser un nouvel horaire vide
  const initializeSchedule = () => {
    const initialSchedule: Record<string, Record<string, string>> = {};
    
    days.forEach((day) => {
      initialSchedule[day] = {};
      scheduleConfig.RD.blocks.forEach((block) => {
        const slots = generateSlotsForBlock(block);
        slots.forEach((slot) => {
          initialSchedule[day][slot.start] = "";
        });
      });
    });

    setScheduleData(initialSchedule);
  };

  // Gère les changements dans les sélections d'horaires
  const handleScheduleChange = (day: string, time: string, value: string) => {
    setScheduleData((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [time]: value,
      },
    }));
    setHasUnsavedChanges(true);
  };

  // Copier un jour vers tous les autres
  const copyDayToAll = (sourceDay: string) => {
    if (!confirm(`Copier l'horaire du ${sourceDay} vers tous les jours?`)) return;
    
    const updatedSchedule = { ...scheduleData };
    
    days.forEach((day) => {
      if (day !== sourceDay) {
        updatedSchedule[day] = { ...updatedSchedule[sourceDay] };
      }
    });
    
    setScheduleData(updatedSchedule);
    setHasUnsavedChanges(true);
    toast.info(`Horaire du ${sourceDay} copié vers tous les jours`);
  };

  // Effacer un jour
  const clearDay = (day: string) => {
    if (!confirm(`Effacer l'horaire du ${day}?`)) return;
    
    const updatedSchedule = { ...scheduleData };
    
    Object.keys(updatedSchedule[day] || {}).forEach((timeKey) => {
      updatedSchedule[day][timeKey] = "";
    });
    
    setScheduleData(updatedSchedule);
    setHasUnsavedChanges(true);
    toast.info(`Horaire du ${day} effacé`);
  };

  // Sauvegarder l'horaire dans Firestore
  const saveSchedule = async () => {
    if (!schoolId) return toast.error("Identifiant d'école non disponible");
    setIsSaving(true);

    try {
      const scheduleRef = doc(
        firestore,
        "schools",
        schoolId,
        "horaires",
        selectedClass
      );
      
      const currentTime = new Date();
      
      await setDoc(
        scheduleRef,
        {
          classe: selectedClass,
          schedule: scheduleData,
          updatedAt: currentTime,
          updatedBy: auth.currentUser?.uid || "unknown",
        },
        { merge: true }
      );

      setLastSaved(currentTime);
      setHasUnsavedChanges(false);
      toast.success("Horaire sauvegardé avec succès !");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  // Exporter l'horaire en PDF (fonction de base, à compléter avec une librairie comme jsPDF)


  // Exporter l'horaire en PDF
  const exportSchedule = () => {
    // Initialiser un nouveau document PDF
    const doc = new jsPDF();
  
    // Titre du document
    doc.setFontSize(18);
    doc.text(`Horaire - ${selectedClass.toUpperCase()}`, 10, 10);
  
    // Date et heure de génération
    const generationDate = new Date().toLocaleString();
    doc.setFontSize(10);
    doc.text(`Généré le: ${generationDate}`, 10, 15);
  
    // Position initiale pour le contenu
    let yPosition = 25;
  
    // Parcourir les créneaux horaires et ajouter les données au PDF
    days.forEach((day) => {
      doc.setFontSize(12);
      doc.setTextColor("#0000FF");
      doc.text(`${day}:`, 10, yPosition);
      yPosition += 5;
  
      timeSlots.forEach((slot) => {
        if (!slot.isBreak) {
          const subject = scheduleData[day]?.[slot.start] || "Non défini";
          doc.setFontSize(10);
          doc.setTextColor("#000000");
          doc.text(
            `${slot.start} - ${slot.end}: ${subject}`,
            15,
            yPosition
          );
          yPosition += 5;
        }
      });
  
      // Ajouter un espace entre les jours
      yPosition += 5;
    });
  
    // Sauvegarder le fichier PDF
    doc.save(`horaire-${selectedClass}.pdf`);
  
    // Notification utilisateur
    toast.success("Horaire exporté avec succès !");
  };
  // Afficher l'indicateur de chargement
  if (isLoading) {
    return (
      <div className="p-6 flex flex-col justify-center items-center h-64 bg-white rounded-3xl shadow-lg">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-blue-600 font-medium">Chargement de l'horaire...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-b mt-5 from-blue-50 to-white rounded-3xl shadow-2xl max-w-7xl mx-auto">
      {/* Header avec actions */}
      <div className="flex flex-wrap items-center mb-8 gap-4">
        <button
          className="p-4 bg-blue-100 hover:bg-blue-200 rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-300"
          onClick={onRetour}
          aria-label="Retour"
        >
          <FaArrowLeft className="text-blue-600" size={24} />
        </button>

        <div className="flex-1">
          <h2 className="text-3xl font-bold text-blue-800 tracking-wide flex items-center">
            <span className="mr-3">📅</span> 
            Horaire - {selectedClass.toUpperCase()}
          </h2>
          
          <div className="flex flex-wrap items-center mt-2 text-sm text-blue-600">
            <div className="flex items-center mr-6">
              <FaClock className="mr-2" />
              <span>
                {scheduleConfig[scheduleType].blocks[currentBlockIndex].label}:{" "}
                <span className="font-semibold">
                  {scheduleConfig[scheduleType].blocks[currentBlockIndex].start} →{" "}
                  {scheduleConfig[scheduleType].blocks[currentBlockIndex].end}
                </span>
              </span>
            </div>
            
            {lastSaved && (
              <div className="text-gray-500 text-xs">
                Dernière sauvegarde: {lastSaved.toLocaleString()}
              </div>
            )}
          </div>
        </div>
        
        {/* Bouton de sauvegarde positionné dans le header */}
        <button
          className={`px-6 py-3 rounded-xl transition-all transform hover:scale-105 
                    flex items-center space-x-2 shadow-md ${
                      hasUnsavedChanges 
                        ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white animate-pulse" 
                        : "bg-gray-100 text-gray-500"
                    }`}
          onClick={saveSchedule}
          disabled={isSaving || !hasUnsavedChanges}
        >
          {isSaving ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Enregistrement...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <FaCheckCircle size={18} />
              <span>Enregistrer</span>
            </div>
          )}
        </button>
      </div>

      {/* Boutons de sélection pour Matin / Après-midi */}
      <div className="flex flex-wrap justify-center space-x-4 mb-6">
        {scheduleConfig[scheduleType].blocks.map((block, index) => (
          <button
            key={index}
            onClick={() => setCurrentBlockIndex(index)}
            className={`px-5 py-3 rounded-lg transition-all ${
              currentBlockIndex === index
                ? "bg-blue-600 text-white shadow-lg scale-105"
                : "bg-white text-blue-600 border border-blue-100 hover:bg-blue-50"
            } flex items-center space-x-2 mb-2`}
          >
            {block.icon}
            <span>{block.label}</span>
          </button>
        ))}
      </div>

      {/* Actions rapides */}
      <div className="mb-6 p-4 bg-blue-50 rounded-xl">
        <details>
          <summary className="cursor-pointer font-medium text-blue-700 hover:text-blue-800">
            Actions rapides
          </summary>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {days.map((day) => (
              <div key={day} className="flex space-x-2">
                <button
                  onClick={() => copyDayToAll(day)}
                  className="text-xs px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg flex-1"
                >
                  Copier {day}
                </button>
                <button
                  onClick={() => clearDay(day)}
                  className="text-xs px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg"
                >
                  Effacer
                </button>
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* Tableau des créneaux amélioré */}
      <div className="overflow-x-auto rounded-2xl border border-blue-100 shadow-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-6 py-5 text-left sticky left-0 bg-blue-600 z-10 w-40">
                <span className="lg:pl-2">Intervalle</span>
              </th>
              {days.map((day) => (
                <th key={day} className="px-6 py-5 text-center">
                  <span className="hidden lg:inline">{day}</span>
                  <span className="lg:hidden">{day.slice(0, 3)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {timeSlots.map((slot, index) => (
              <tr
                key={`${slot.start}-${index}`}
                className={slot.isBreak 
                  ? "bg-yellow-50" 
                  : index % 2 === 0 
                    ? "bg-blue-50" 
                    : "bg-white"
                }
              >
                <td 
                  className={`px-6 py-5 whitespace-nowrap sticky left-0 border-r border-blue-100 z-10 ${
                    slot.isBreak
                      ? "font-bold text-amber-700 bg-yellow-50"
                      : "font-semibold text-blue-800 bg-inherit"
                  }`}
                >
                  {slot.start} - {slot.end}
                  {slot.isBreak && (
                    <div className="text-xs font-normal mt-1">Récréation</div>
                  )}
                </td>
                
                {days.map((day) => (
                  <td key={`${day}-${slot.start}`} className="px-6 py-4">
                    {slot.isBreak ? (
                      <div className="w-full px-4 py-3 text-center text-amber-700 bg-yellow-50 rounded-xl border border-yellow-200">
                        Pause
                      </div>
                    ) : (
                      <select
                        className="w-full px-4 py-3 border border-blue-200 rounded-xl 
                                 focus:outline-none focus:ring-2 focus:ring-blue-300 
                                 bg-white placeholder-blue-300 transition-all"
                        value={scheduleData[day]?.[slot.start] || ""}
                        onChange={(e) =>
                          handleScheduleChange(day, slot.start, e.target.value)
                        }
                      >
                        <option value="">-- Sélectionner --</option>
                        {currentSubjects.map((subject) => (
                          <option
                            key={subject.name}
                            value={subject.name}
                          >
                            {subject.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions en bas de page */}
      <div className="flex flex-wrap justify-between mt-8 gap-4">
        <button
          className="px-6 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700
                    rounded-xl transition-all hover:scale-105 flex items-center space-x-2"
          onClick={exportSchedule}
        >
          <span>Exporter l'horaire</span>
        </button>

        <button
          className={`px-10 py-4 rounded-xl transition-all transform hover:scale-105 
                    flex items-center space-x-3 shadow-lg ${
                      hasUnsavedChanges 
                        ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white" 
                        : "bg-gray-100 text-gray-500"
                    }`}
          onClick={saveSchedule}
          disabled={isSaving || !hasUnsavedChanges}
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
