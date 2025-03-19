"use client";
import React, { useState, useEffect, useMemo } from "react";
import { auth, firestore } from "@/config/firebase";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { Calendar, Clock, MapPin, User, AlertCircle, BookOpen, Download, Filter, Search, ChevronDown, ChevronUp, Calendar as CalendarIcon, X } from "lucide-react";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";
import { fr } from "date-fns/locale";

// Types exhaustifs
type ExamTime = {
  examDate: string;
  startTime: string;
  endTime: string;
  location?: string;
  examiner?: string;
  notes?: string;
  materials?: string[];
  duration?: number; // en minutes
};

type SubjectSchedule = {
  sem1: ExamTime;
  sem2: ExamTime;
  subjectCode?: string;
  teacher?: string;
  coefficient?: number;
};

type ExamScheduleData = {
  schedules: Record<string, SubjectSchedule>;
  lastUpdated?: string;
  academicYear?: string;
  schoolName?: string;
  className?: string;
};

type UserData = {
  role: string;
  schoolId: string;
  classe: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

export default function HoraireExamEleve() {
  // États principaux
  const [loading, setLoading] = useState(true);
  const [examSchedule, setExamSchedule] = useState<ExamScheduleData | null>(null);
  const [error, setError] = useState<string>("");
  const [userData, setUserData] = useState<UserData | null>(null);
  
  // États pour les fonctionnalités avancées
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemester, setFilterSemester] = useState<"all" | "sem1" | "sem2">("all");
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "subject">("date");
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("Utilisateur non authentifié. Veuillez vous connecter pour accéder à vos horaires d'examen.");
          setLoading(false);
          return;
        }

        // Récupérer le document de l'utilisateur
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          setError("Votre profil est introuvable. Veuillez contacter l'administration.");
          setLoading(false);
          return;
        }

        const userDataFromFirestore = userDoc.data() as UserData;
        setUserData(userDataFromFirestore);

        // Vérifier que l'utilisateur est un élève
        if (userDataFromFirestore.role !== "élève") {
          setError("Cette page est réservée aux élèves.");
          setLoading(false);
          return;
        }

        // Récupérer l'ID de l'école et la classe de l'utilisateur
        const schoolId = userDataFromFirestore.schoolId;
        const classe = userDataFromFirestore.classe;
        
        if (!schoolId || !classe) {
          setError("Informations de votre école ou classe manquantes dans votre profil.");
          setLoading(false);
          return;
        }

        // Récupérer l'horaire des examens de la classe dans Firestore
        const examScheduleDocRef = doc(
          firestore,
          "schools",
          schoolId,
          "examSchedules",
          classe
        );
        
        const examScheduleDoc = await getDoc(examScheduleDocRef);
        
        if (examScheduleDoc.exists()) {
          const scheduleData = examScheduleDoc.data() as ExamScheduleData;
          
          // Récupérer les informations supplémentaires sur l'école
          const schoolDocRef = doc(firestore, "schools", schoolId);
          const schoolDoc = await getDoc(schoolDocRef);
          
          if (schoolDoc.exists()) {
            const schoolData = schoolDoc.data();
            scheduleData.schoolName = schoolData.name;
          }
          
          setExamSchedule(scheduleData);
        } else {
          setError("Aucun horaire d'examen n'est encore disponible pour votre classe.");
        }
      } catch (err) {
        console.error("Erreur lors de la récupération de l'horaire des examens :", err);
        setError("Une erreur est survenue lors du chargement de vos horaires d'examen.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fonction pour déterminer si un examen est à venir
  const isUpcoming = (dateStr: string): boolean => {
    try {
      const today = new Date();
      const examDate = parseISO(dateStr);
      return isAfter(examDate, today) || format(examDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    } catch (e) {
      return false;
    }
  };

  // Fonction pour calculer le nombre de jours restants jusqu'à l'examen
  const daysUntilExam = (dateStr: string): number | null => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const examDate = parseISO(dateStr);
      const diffTime = examDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      return null;
    }
  };

  // Obtenir la prochaine date d'examen pour une matière
  const getNextExamDate = (schedule: SubjectSchedule): string | null => {
    const today = new Date();
    
    if (schedule.sem1?.examDate && isUpcoming(schedule.sem1.examDate)) {
      return schedule.sem1.examDate;
    }
    
    if (schedule.sem2?.examDate && isUpcoming(schedule.sem2.examDate)) {
      return schedule.sem2.examDate;
    }
    
    // Si aucun examen n'est à venir, retourner la date la plus récente
    if (schedule.sem1?.examDate && schedule.sem2?.examDate) {
      return isAfter(parseISO(schedule.sem1.examDate), parseISO(schedule.sem2.examDate)) 
        ? schedule.sem1.examDate 
        : schedule.sem2.examDate;
    }
    
    return schedule.sem1?.examDate || schedule.sem2?.examDate || null;
  };

  // Filtre et tri des matières en fonction des critères sélectionnés
  const filteredSubjects = useMemo(() => {
    if (!examSchedule?.schedules) return [];

    let subjects = Object.entries(examSchedule.schedules);

    // Appliquer la recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      subjects = subjects.filter(([subject, data]) => 
        subject.toLowerCase().includes(term) || 
        data.subjectCode?.toLowerCase().includes(term) ||
        data.teacher?.toLowerCase().includes(term) ||
        data.sem1.location?.toLowerCase().includes(term) ||
        data.sem2.location?.toLowerCase().includes(term) ||
        data.sem1.examiner?.toLowerCase().includes(term) ||
        data.sem2.examiner?.toLowerCase().includes(term)
      );
    }

    // Filtrer par semestre
    if (filterSemester !== "all") {
      subjects = subjects.filter(([_, data]) => {
        if (filterSemester === "sem1") return data.sem1 && data.sem1.examDate;
        if (filterSemester === "sem2") return data.sem2 && data.sem2.examDate;
        return true;
      });
    }

    // Filtrer pour ne montrer que les examens à venir
    if (showUpcomingOnly) {
      subjects = subjects.filter(([_, data]) => {
        const sem1Upcoming = data.sem1?.examDate && isUpcoming(data.sem1.examDate);
        const sem2Upcoming = data.sem2?.examDate && isUpcoming(data.sem2.examDate);
        return sem1Upcoming || sem2Upcoming;
      });
    }

    // Trier les matières
    if (sortBy === "date") {
      subjects.sort((a, b) => {
        const aDate = getNextExamDate(a[1]);
        const bDate = getNextExamDate(b[1]);
        if (!aDate) return 1;
        if (!bDate) return -1;
        return aDate.localeCompare(bDate);
      });
    } else {
      subjects.sort((a, b) => a[0].localeCompare(b[0]));
    }

    return subjects;
  }, [examSchedule, searchTerm, filterSemester, showUpcomingOnly, sortBy]);

  // Fonction pour exporter les données au format CSV
  const exportToCSV = () => {
    if (!examSchedule) return;
    
    const headers = ["Matière", "Date Sem1", "Horaire Sem1", "Salle Sem1", "Surveillant Sem1", "Date Sem2", "Horaire Sem2", "Salle Sem2", "Surveillant Sem2"];
    
    let csvContent = headers.join(",") + "\n";
    
    Object.entries(examSchedule.schedules).forEach(([subject, schedule]) => {
      const row = [
        subject,
        schedule.sem1?.examDate || "",
        `${schedule.sem1?.startTime || ""} - ${schedule.sem1?.endTime || ""}`,
        schedule.sem1?.location || "",
        schedule.sem1?.examiner || "",
        schedule.sem2?.examDate || "",
        `${schedule.sem2?.startTime || ""} - ${schedule.sem2?.endTime || ""}`,
        schedule.sem2?.location || "",
        schedule.sem2?.examiner || ""
      ];
      
      csvContent += row.join(",") + "\n";
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `horaires_examens_${examSchedule.className || "classe"}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowExportOptions(false);
  };

  // Composant pour afficher les informations d'un semestre
  const SemesterInfo = ({ 
    semData, 
    semesterName, 
    expanded = false 
  }: { 
    semData: ExamTime; 
    semesterName: string;
    expanded?: boolean;
  }) => {
    const daysLeft = semData.examDate ? daysUntilExam(semData.examDate) : null;
    const isExamSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
    const isToday = daysLeft === 0;
    
    let formattedDate = "";
    try {
      formattedDate = format(parseISO(semData.examDate), "EEEE d MMMM yyyy", { locale: fr });
    } catch (e) {
      formattedDate = semData.examDate || "Date non spécifiée";
    }
    
    return (
      <div className={`mt-3 rounded-lg ${isToday ? 'bg-blue-50 border border-blue-200' : isExamSoon ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'} p-4`}>
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-gray-800">{semesterName}</h3>
          {isToday && (
            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md font-medium">Aujourd'hui</span>
          )}
          {isExamSoon && !isToday && (
            <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-md font-medium">
              Dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <span className="flex-grow">Date: <span className="font-medium">{formattedDate}</span></span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <span className="flex-grow">Horaire: <span className="font-medium">{semData.startTime} - {semData.endTime}</span>
            {semData.duration && <span className="text-gray-500 text-sm ml-1">({semData.duration} min)</span>}
            </span>
          </div>
          
          {semData.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <span className="flex-grow">Salle: <span className="font-medium">{semData.location}</span></span>
            </div>
          )}
          
          {semData.examiner && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <span className="flex-grow">Surveillant: <span className="font-medium">{semData.examiner}</span></span>
            </div>
          )}
          
          {expanded && semData.notes && (
            <div className="mt-2 bg-white p-2 rounded border border-gray-200">
              <p className="text-sm text-gray-700">{semData.notes}</p>
            </div>
          )}
          
          {expanded && semData.materials && semData.materials.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium mb-1">Matériel autorisé:</p>
              <ul className="list-disc list-inside text-sm text-gray-700 pl-2">
                {semData.materials.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Composant pour l'en-tête de la page
  const PageHeader = () => (
    <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Horaires d'examens</h1>
          <p className="text-gray-600 mt-1">
            {examSchedule?.academicYear 
              ? `Année scolaire ${examSchedule.academicYear}` 
              : "Année scolaire en cours"}
            {examSchedule?.className && ` - ${examSchedule.className}`}
          </p>
          {examSchedule?.schoolName && (
            <p className="text-gray-500 text-sm">{examSchedule.schoolName}</p>
          )}
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowExportOptions(!showExportOptions)}
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded flex items-center gap-2 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
          
          {showExportOptions && (
            <div className="absolute right-0 mt-1 bg-white shadow-lg rounded-md border border-gray-200 p-2 w-44 z-10">
              <button 
                onClick={exportToCSV}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
              >
                Format CSV
              </button>
              <button 
                onClick={() => {/* Export to PDF functionality */}}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
              >
                Format PDF
              </button>
              <button 
                onClick={() => {/* Add to Calendar functionality */}}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
              >
                Ajouter au calendrier
              </button>
            </div>
          )}
        </div>
      </div>
      
      {examSchedule?.lastUpdated && (
        <p className="text-xs text-gray-500 mt-2">
          Dernière mise à jour: {format(new Date(examSchedule.lastUpdated), "dd/MM/yyyy à HH:mm", { locale: fr })}
        </p>
      )}
    </div>
  );

  // Composant pour les filtres
  const FilterControls = () => (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Rechercher une matière, salle, surveillant..."
            className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={() => setSearchTerm("")}
            >
              <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
            </button>
          )}
        </div>
        
        <div className="flex gap-2 md:gap-4 flex-wrap">
          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value as "all" | "sem1" | "sem2")}
            className="px-3 py-2 border rounded-md text-sm bg-white"
          >
            <option value="all">Tous les semestres</option>
            <option value="sem1">1er Semestre</option>
            <option value="sem2">2ème Semestre</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "subject")}
            className="px-3 py-2 border rounded-md text-sm bg-white"
          >
            <option value="date">Trier par date</option>
            <option value="subject">Trier par matière</option>
          </select>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showUpcomingOnly}
              onChange={() => setShowUpcomingOnly(!showUpcomingOnly)}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="text-sm">À venir uniquement</span>
          </label>
        </div>
      </div>
    </div>
  );

  // États de chargement et d'erreur
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="mt-4 text-gray-600">Chargement de vos horaires d'examen...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium"
              >
                Rafraîchir la page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <PageHeader />
      <FilterControls />

      {examSchedule && examSchedule.schedules ? (
        <>
          {filteredSubjects.length > 0 ? (
            <div className="grid gap-4 md:gap-6">
              {filteredSubjects.map(([subject, schedule]) => {
              const nextExamDate = getNextExamDate(schedule);
              const daysLeft = nextExamDate ? daysUntilExam(nextExamDate) : null;
              const isExamSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
              const isToday = daysLeft === 0;
              
              return (
                <div
                  key={subject}
                  className={`bg-white rounded-lg shadow-sm border ${
                    isToday ? "border-blue-300" : isExamSoon ? "border-yellow-300" : "border-gray-200"
                  } hover:shadow-md transition-shadow overflow-hidden`}
                >
                  {/* En-tête statique, sans gestion d'extension */}
                  <div className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <div>
                        <h2 className="text-lg font-semibold text-gray-800">{subject}</h2>
                        {schedule.subjectCode && (
                          <p className="text-xs text-gray-500">Code: {schedule.subjectCode}</p>
                        )}
                      </div>
                    </div>
                    {/* Vous pouvez retirer les icônes de bascule */}
                  </div>
                  
                  {/* Contenu toujours affiché */}
                  <div className="px-4 pb-4">
                    {schedule.teacher && (
                      <p className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Enseignant:</span> {schedule.teacher}
                      </p>
                    )}
                    
                    {(filterSemester === "all" || filterSemester === "sem1") && schedule.sem1 && (
                      <SemesterInfo 
                        semData={schedule.sem1} 
                        semesterName="1er Semestre" 
                        expanded={true}  // Toujours afficher les détails
                      />
                    )}
                    
                    {(filterSemester === "all" || filterSemester === "sem2") && schedule.sem2 && (
                      <SemesterInfo 
                        semData={schedule.sem2} 
                        semesterName="2ème Semestre" 
                        expanded={true}  // Toujours afficher les détails
                      />
                    )}
                  </div>
                </div>
              );
            })}

            </div>
          ) : (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Aucun examen trouvé avec les filtres actuels.
                  </p>
                  {searchTerm || filterSemester !== "all" || showUpcomingOnly ? (
                    <button 
                      onClick={() => {
                        setSearchTerm("");
                        setFilterSemester("all");
                        setShowUpcomingOnly(false);
                      }}
                      className="mt-2 px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded text-xs font-medium"
                    >
                      Réinitialiser les filtres
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">Aucun horaire d'examen n'est encore disponible.</p>
              <p className="text-xs text-yellow-600 mt-1">Vérifiez ultérieurement ou contactez votre administration si vous pensez qu'il s'agit d'une erreur.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}