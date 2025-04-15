"use client";
import React, { useState, useEffect, useMemo } from "react";
import { sections } from "@/data/cours";
import {
  CheckCircle,
  Calendar,
  Clock,
  ArrowLeft,
  Save,
  AlertTriangle,
  X,
} from "lucide-react";
import { firestore, auth } from "@/config/firebase";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

// ------------------------
// Types
// ------------------------
interface Subject {
  name: string;
  icon: string;
  maxima: number[];
}

interface ExamSchedule {
  examDate: string;
  startTime: string;
  endTime: string;
  location?: string; // Salle d'examen optionnelle
  // Permet de sélectionner plusieurs surveillants
  examiner: string[];
}

interface SubjectExamSchedule {
  sem1: ExamSchedule;
  sem2: ExamSchedule;
}

interface HoraireExamProps {
  selectedClass: string;
  onRetour: () => void;
}

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}

// ------------------------
// Composant Toast
// ------------------------
const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const bgColor =
    type === "success"
      ? "bg-green-100 border-green-500"
      : type === "error"
      ? "bg-red-100 border-red-500"
      : "bg-blue-100 border-blue-500";
  const textColor =
    type === "success"
      ? "text-green-800"
      : type === "error"
      ? "text-red-800"
      : "text-blue-800";
  const icon =
    type === "success" ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : type === "error" ? (
      <AlertTriangle className="h-5 w-5 text-red-500" />
    ) : null;

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg border-l-4 shadow-lg flex items-center justify-between ${bgColor} max-w-md animate-slide-in`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <p className={`${textColor} font-medium`}>{message}</p>
      </div>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// ------------------------
// Composant personnalisée SurveillantSelector
// ------------------------
interface SurveillantSelectorProps {
  value: string[];
  onChange: (newValue: string[]) => void;
  options: Array<{ id: string; displayName: string }>;
}

const SurveillantSelector: React.FC<SurveillantSelectorProps> = ({
  value,
  onChange,
  options,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentSurveillant, setCurrentSurveillant] = useState("");

  // Filtrage des options selon la saisie de l'utilisateur
  const filteredOptions = options.filter((option) =>
    option.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    const trimmed = currentSurveillant.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setCurrentSurveillant("");
      setSearchTerm("");
      setDropdownOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex">
        <input
          type="text"
          value={searchTerm || currentSurveillant}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setDropdownOpen(true);
            setCurrentSurveillant(e.target.value);
          }}
          onFocus={() => setDropdownOpen(true)}
          placeholder="Rechercher un surveillant..."
          className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="bg-green-500 text-white px-4 py-2 rounded-r-md"
        >
          Ajouter
        </button>
      </div>
      {dropdownOpen && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-auto shadow-md">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <li
                key={option.id}
                onClick={() => {
                  setCurrentSurveillant(option.displayName);
                  setSearchTerm(option.displayName);
                  setDropdownOpen(false);
                }}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {option.displayName}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-gray-500">Aucun surveillant trouvé</li>
          )}
        </ul>
      )}
      {value.length > 0 && (
        <div className="mt-2">
          <ul className="flex flex-wrap gap-2">
            {value.map((s, index) => (
              <li
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-1 text-sm"
              >
                <span>{s}</span>
                <button
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                  className="hover:text-red-600"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ------------------------
// Composant principal ExamScheduleManager
// ------------------------
const ExamScheduleManager = ({ selectedClass, onRetour }: HoraireExamProps) => {
  // Récupération des matières pour la classe sélectionnée
  const subjects = useMemo(() => {
    const filteredSections = sections.filter((section) =>
      section.classe.includes(selectedClass)
    );
    return filteredSections.flatMap((section) => section.subjects);
  }, [selectedClass]);

  const [examSchedules, setExamSchedules] = useState<Record<string, SubjectExamSchedule>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"sem1" | "sem2">("sem1");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [conflictCheck, setConflictCheck] = useState(true);
  const [advancedOptions, setAdvancedOptions] = useState(false);
  const [schoolId, setSchoolId] = useState<string>("");
  const [professeurs, setProfesseurs] = useState<Array<{ id: string; displayName: string }>>([]);

  // Récupérer l'identifiant de l'école via l'utilisateur authentifié
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setSchoolId(user.uid);
    }
  }, []);

  // Charger les professeurs depuis Firestore (filtré par rôle et schoolId)
  useEffect(() => {
    const fetchProfesseurs = async () => {
      try {
        const q = query(
          collection(firestore, "users"),
          where("role", "==", "professeur"),
          where("schoolId", "==", schoolId)
        );
        const querySnapshot = await getDocs(q);
        const profList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as { displayName: string }),
        }));
        setProfesseurs(profList);
      } catch (error) {
        console.error("Erreur lors de la récupération des professeurs:", error);
      }
    };
    if (schoolId) {
      fetchProfesseurs();
    }
  }, [schoolId]);

  // Initialisation des horaires et chargement depuis localStorage
  useEffect(() => {
    const initialSchedules: Record<string, SubjectExamSchedule> = {};
    subjects.forEach((subject) => {
      initialSchedules[subject.name] = {
        sem1: { examDate: "", startTime: "", endTime: "", location: "", examiner: [] },
        sem2: { examDate: "", startTime: "", endTime: "", location: "", examiner: [] },
      };
    });
    setExamSchedules(initialSchedules);

    const savedData = localStorage.getItem(`examSchedules-${selectedClass}`);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setExamSchedules(parsedData);
      } catch (e) {
        console.error("Erreur lors du chargement des données sauvegardées:", e);
      }
    }
  }, [subjects, selectedClass]);

  // Modification des champs classiques
  const handleInputChange = (
    subjectName: string,
    semester: "sem1" | "sem2",
    field: keyof ExamSchedule,
    value: string
  ) => {
    setExamSchedules((prev) => {
      const newSchedules = {
        ...prev,
        [subjectName]: {
          ...prev[subjectName],
          [semester]: {
            ...prev[subjectName][semester],
            [field]: value,
          },
        },
      };
      localStorage.setItem(`examSchedules-${selectedClass}`, JSON.stringify(newSchedules));
      return newSchedules;
    });
  };

  // Mise à jour du tableau des surveillants pour une matière/semestre donné(e)
  const updateExaminerForSubject = (
    subjectName: string,
    semester: "sem1" | "sem2",
    newExaminer: string[]
  ) => {
    setExamSchedules((prev) => {
      const newSchedules = {
        ...prev,
        [subjectName]: {
          ...prev[subjectName],
          [semester]: {
            ...prev[subjectName][semester],
            examiner: newExaminer,
          },
        },
      };
      localStorage.setItem(`examSchedules-${selectedClass}`, JSON.stringify(newSchedules));
      return newSchedules;
    });
  };

  // Détection des conflits d'horaires
  const findConflicts = () => {
    const conflicts: { semester: string; subject1: string; subject2: string; date: string }[] = [];
    const semesterSchedules: { [key: string]: { subject: string; date: string; start: string; end: string }[] } = { sem1: [], sem2: [] };

    Object.entries(examSchedules).forEach(([subjectName, schedule]) => {
      ["sem1", "sem2"].forEach((sem) => {
        const semSchedule = schedule[sem as "sem1" | "sem2"];
        if (semSchedule.examDate && semSchedule.startTime && semSchedule.endTime) {
          semesterSchedules[sem as "sem1" | "sem2"].push({
            subject: subjectName,
            date: semSchedule.examDate,
            start: semSchedule.startTime,
            end: semSchedule.endTime,
          });
        }
      });
    });

    ["sem1", "sem2"].forEach((sem) => {
      const schedules = semesterSchedules[sem];
      for (let i = 0; i < schedules.length; i++) {
        for (let j = i + 1; j < schedules.length; j++) {
          const a = schedules[i];
          const b = schedules[j];
          if (a.date === b.date) {
            if (a.start < b.end && a.end > b.start) {
              conflicts.push({
                semester: sem === "sem1" ? "1er Semestre" : "2ème Semestre",
                subject1: a.subject,
                subject2: b.subject,
                date: a.date,
              });
            }
          }
        }
      }
    });

    return conflicts;
  };

  // Soumission et sauvegarde dans Firestore
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    for (const subject of subjects) {
      const subjectSchedule = examSchedules[subject.name];
      ["sem1", "sem2"].forEach((sem) => {
        const schedule = subjectSchedule[sem as "sem1" | "sem2"];
        if (schedule.startTime && schedule.endTime && schedule.startTime >= schedule.endTime) {
          setToast({
            message: `${subject.name}: L'heure de début doit être avant l'heure de fin (${sem === "sem1" ? "1er" : "2ème"} semestre)`,
            type: "error",
          });
          hasError = true;
        }
      });
    }

    if (conflictCheck) {
      const conflicts = findConflicts();
      if (conflicts.length > 0) {
        conflicts.forEach((conflict) => {
          setToast({
            message: `Conflit: ${conflict.subject1} et ${conflict.subject2} (${conflict.semester}, ${conflict.date})`,
            type: "error",
          });
        });
        hasError = true;
      }
    }

    if (hasError) return;

    setIsSubmitting(true);

    try {
      if (!schoolId) {
        throw new Error("Identifiant de l'école non défini");
      }
      // Sauvegarder dans Firestore sous la sous-collection schools
      const examScheduleDocRef = doc(firestore, "schools", schoolId, "examSchedules", selectedClass);
      await setDoc(
        examScheduleDocRef,
        {
          schedules: examSchedules,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      localStorage.setItem(`examSchedules-${selectedClass}`, JSON.stringify(examSchedules));

      setToast({ message: "Les horaires des examens ont été sauvegardés avec succès!", type: "success" });

      setTimeout(onRetour, 2000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setToast({ message: "Erreur lors de la sauvegarde des horaires. Veuillez réessayer.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Générer des horaires d'examen aléatoires
  const generateRandomSchedules = () => {
    if (!window.confirm("Voulez-vous générer des horaires d'examen aléatoires? Cela remplacera toutes les données existantes.")) {
      return;
    }

    const newSchedules = { ...examSchedules };
    const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    const currentYear = new Date().getFullYear();
    const sem1Month = months[0]; // Janvier
    const sem2Month = months[5]; // Juin
    let sem1Day = 10;
    let sem2Day = 10;

    Object.keys(newSchedules).forEach((subject) => {
      const sem1StartHour = 8 + Math.floor(Math.random() * 6);
      const sem1EndHour = sem1StartHour + 1 + Math.floor(Math.random() * 2);
      const sem1Date = `${currentYear}-${sem1Month}-${sem1Day.toString().padStart(2, "0")}`;
      const sem1Start = `${sem1StartHour.toString().padStart(2, "0")}:00`;
      const sem1End = `${sem1EndHour.toString().padStart(2, "0")}:00`;

      const sem2StartHour = 8 + Math.floor(Math.random() * 6);
      const sem2EndHour = sem2StartHour + 1 + Math.floor(Math.random() * 2);
      const sem2Date = `${currentYear}-${sem2Month}-${sem2Day.toString().padStart(2, "0")}`;
      const sem2Start = `${sem2StartHour.toString().padStart(2, "0")}:00`;
      const sem2End = `${sem2EndHour.toString().padStart(2, "0")}:00`;

      newSchedules[subject] = {
        sem1: {
          examDate: sem1Date,
          startTime: sem1Start,
          endTime: sem1End,
          location: `Salle ${100 + Math.floor(Math.random() * 20)}`,
          examiner: [] // Réinitialiser les surveillants
        },
        sem2: {
          examDate: sem2Date,
          startTime: sem2Start,
          endTime: sem2End,
          location: `Salle ${100 + Math.floor(Math.random() * 20)}`,
          examiner: []
        }
      };

      sem1Day++;
      sem2Day++;
    });

    setExamSchedules(newSchedules);
    setToast({ message: "Horaires générés avec succès! Vérifiez et ajustez si nécessaire.", type: "success" });
  };

  // Effacer toutes les données d'horaires
  const clearAllSchedules = () => {
    if (!window.confirm("Êtes-vous sûr de vouloir effacer tous les horaires d'examen?")) {
      return;
    }

    const emptySchedules: Record<string, SubjectExamSchedule> = {};
    subjects.forEach((subject) => {
      emptySchedules[subject.name] = {
        sem1: { examDate: "", startTime: "", endTime: "", location: "", examiner: [] },
        sem2: { examDate: "", startTime: "", endTime: "", location: "", examiner: [] },
      };
    });

    setExamSchedules(emptySchedules);
    localStorage.removeItem(`examSchedules-${selectedClass}`);
    setToast({ message: "Tous les horaires ont été effacés.", type: "success" });
  };

  return (
    <div className="max-w-5xl mx-auto mt-5 bg-white shadow-lg rounded-lg overflow-hidden">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Horaires des examens - {selectedClass}
          </h1>
          <button
            onClick={onRetour}
            className="px-3 py-2 bg-white/20 text-white rounded-md hover:bg-white/30 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
        </div>
        {/* Onglets Semestre */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("sem1")}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === "sem1"
                ? "bg-white text-blue-800"
                : "bg-blue-700/50 text-white hover:bg-blue-700/80"
            }`}
          >
            1er Semestre
          </button>
          <button
            onClick={() => setActiveTab("sem2")}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === "sem2"
                ? "bg-white text-blue-800"
                : "bg-blue-700/50 text-white hover:bg-blue-700/80"
            }`}
          >
            2ème Semestre
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-6">
        {/* Options et contrôles */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="conflictCheck"
                checked={conflictCheck}
                onChange={() => setConflictCheck(!conflictCheck)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="conflictCheck" className="text-sm text-gray-700">
                Vérifier les conflits d'horaires
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="advancedOptions"
                checked={advancedOptions}
                onChange={() => setAdvancedOptions(!advancedOptions)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="advancedOptions" className="text-sm text-gray-700">
                Options avancées
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={generateRandomSchedules}
              className="px-3 py-1.5 text-xs text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            >
              Générer des exemples
            </button>
            <button
              type="button"
              onClick={clearAllSchedules}
              className="px-3 py-1.5 text-xs text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors"
            >
              Effacer tout
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {subjects.map((subject) => (
            <div
              key={subject.name}
              className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="bg-gray-50 p-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                  <span className="text-xl">{subject.icon}</span>
                  <span>{subject.name}</span>
                </h2>
                <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Max: {subject.maxima[activeTab === "sem1" ? 2 : 2]} points
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date d'examen
                    </label>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 absolute ml-3" />
                      <input
                        type="date"
                        value={examSchedules[subject.name]?.[activeTab].examDate || ""}
                        onChange={(e) =>
                          handleInputChange(subject.name, activeTab, "examDate", e.target.value)
                        }
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Heure de début
                    </label>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 absolute ml-3" />
                      <input
                        type="time"
                        value={examSchedules[subject.name]?.[activeTab].startTime || ""}
                        onChange={(e) =>
                          handleInputChange(subject.name, activeTab, "startTime", e.target.value)
                        }
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Heure de fin
                    </label>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 absolute ml-3" />
                      <input
                        type="time"
                        value={examSchedules[subject.name]?.[activeTab].endTime || ""}
                        onChange={(e) =>
                          handleInputChange(subject.name, activeTab, "endTime", e.target.value)
                        }
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {advancedOptions && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Salle d'examen
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Salle 101"
                        value={examSchedules[subject.name]?.[activeTab].location || ""}
                        onChange={(e) =>
                          handleInputChange(subject.name, activeTab, "location", e.target.value)
                        }
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Surveillants
                      </label>
                      {/* Utilisation du sélecteur personnalisé pour surveillants */}
                      <SurveillantSelector
                        value={examSchedules[subject.name]?.[activeTab].examiner || []}
                        onChange={(newValue) => updateExaminerForSubject(subject.name, activeTab, newValue)}
                        options={professeurs}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onRetour}
              className="mr-4 py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="py-2.5 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Sauvegarder
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ExamScheduleManager;
