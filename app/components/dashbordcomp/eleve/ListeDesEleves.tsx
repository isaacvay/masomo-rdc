"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { auth, firestore } from "@/config/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import ProfileEleve from "./ProfileEleve";
import BulletinAffiche from "../bulletin/BulletinAffiche";
import ListeEleveMP from "./ListeEleveMP"; // Assurez-vous que le chemin est correct
import DispListEleve from "./DispListEleve"; // Composant qui gère l'affichage du profil/bulletin
import {
  UserCircle,
  Search,
  AlertCircle,
  Loader2,
  ChevronRight,
  School,
  CheckCheck,
  GanttChartSquare,
} from "lucide-react";
import { FaArrowLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  displayName: string;
  sexe: string;
  neEA: string;
  naissance: string;
  section: string;
  classe: string;
  numPerm: string;
  email: string;
  password: string;
  paiement?: boolean;
  schoolId: string;
  bulletinId?: string;
}

interface SchoolInfo {
  province: string;
  ville: string;
  commune: string;
  nom: string;
  code: string;
}

interface ListeDesElevesProps {
  selectedClass?: string;
  onRetour?: () => void;
}

export default function ListeDesEleves({ selectedClass = "7eme", onRetour }: ListeDesElevesProps) {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [checkedStates, setCheckedStates] = useState<{ [key: string]: boolean }>({});
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [isComptable, setIsComptable] = useState(false);

  // Vérifier le rôle de l'utilisateur connecté
  useEffect(() => {
    const checkUserRole = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      try {
        const userDocRef = doc(firestore, "users", uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData.role === "professeur" && userData.secondRole === "comptable") {
            setIsComptable(true);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du rôle utilisateur :", error);
      }
    };
    checkUserRole();
  }, []);

  // Récupérer les informations de l'école
  useEffect(() => {
    const fetchSchoolInfo = async () => {
      let effectiveSchoolId = auth.currentUser?.uid;
      if (!effectiveSchoolId) {
        console.error("Aucune école connectée");
        return;
      }
      try {
        const userDocRef = doc(firestore, "users", effectiveSchoolId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (
            userData.role === "professeur" &&
            userData.secondRole === "comptable" &&
            userData.schoolId
          ) {
            effectiveSchoolId = userData.schoolId;
          }
        }
        if (!effectiveSchoolId) {
          throw new Error("Invalid school ID");
        }
        const schoolDocRef = doc(firestore, "schools", effectiveSchoolId);
        const schoolSnap = await getDoc(schoolDocRef);
        if (schoolSnap.exists()) {
          setSchoolInfo(schoolSnap.data() as SchoolInfo);
        } else {
          console.log("Aucune info d'école trouvée");
          setError("Informations de l'école non trouvées");
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des infos de l'école :", err);
        setError("Erreur de chargement des informations de l'école");
      }
    };
    fetchSchoolInfo();
  }, []);

  // Récupérer les élèves de la classe sélectionnée
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        let effectiveSchoolId = auth.currentUser?.uid;
        if (!effectiveSchoolId) throw new Error("Aucune école connectée");

        const userDocRef = doc(firestore, "users", effectiveSchoolId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (
            userData.role === "professeur" &&
            userData.secondRole === "comptable" &&
            userData.schoolId
          ) {
            effectiveSchoolId = userData.schoolId;
          }
        }

        const usersRef = collection(firestore, "users");
        const q = query(
          usersRef,
          where("role", "==", "élève"),
          where("schoolId", "==", effectiveSchoolId),
          where("classe", "==", selectedClass)
        );
        const snapshot = await getDocs(q);

        const initialCheckedStates: { [key: string]: boolean } = {};
        const data = snapshot.docs.map((docSnap) => {
          const studentData = docSnap.data() as Omit<Student, "id">;
          initialCheckedStates[docSnap.id] = studentData.paiement || false;
          return { id: docSnap.id, ...studentData };
        });
        setStudents(data);
        setCheckedStates(initialCheckedStates);
      } catch (err) {
        console.error("Erreur lors de la récupération des élèves :", err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass]);


  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((student) =>
      student.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const dummySchoolInfo: SchoolInfo = {
    province: "Province",
    ville: "Ville",
    commune: "Commune",
    nom: "Nom de l'école",
    code: "Code",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex flex-col items-center justify-center text-red-600 p-8">
        <AlertCircle className="h-16 w-16 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Erreur de chargement</h2>
        <p className="text-lg text-center max-w-xl">{error}</p>
      </div>
    );
  }

  if (showPrintView) {
    return (
      <ListeEleveMP 
        displayName="Nom Élève" 
        section="Section Exemple" 
        classe={selectedClass} 
        email="email@example.com" 
        password="motdepasse" 
        onRetour={() => setShowPrintView(false)}
        eleves={students}
        loading={loading}
        error={error}
      />
    );
  }

  // Si un élève est sélectionné, on affiche le composant DispListEleve
  if (selectedStudent) {
    return (
      <DispListEleve
        student={selectedStudent}
        schoolInfo={schoolInfo || dummySchoolInfo}
        onRetour={() => setSelectedStudent(null)}
      />
    );
  }

  // Affichage de la liste des élèves
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-8">
      {/* Bouton de retour général */}
      {!selectedStudent && onRetour && (
        <button
          className="bg-blue-500 md:mb-0 mb-4 hover:bg-blue-600 text-white font-medium w-28 md:w-auto py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          onClick={onRetour}
          aria-label="Retour à la page précédente"
        >
          <FaArrowLeft className="shrink-0" />
          <span>Retour</span>
        </button>
      )}
      <div className="container mx-auto px-4">
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-3xl">
          <div className="bg-gradient-to-br from-blue-700 to-indigo-800 p-8 relative">
            <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <School className="h-12 w-12 text-white/90" />
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Classe de {selectedClass}
                  </h1>
                  <p className="text-blue-100/90 mt-2">
                    {students.length} Élève{students.length > 1 ? "s" : ""} inscrits
                  </p>
                </div>
              </div>
              <div className="relative w-full md:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Search className="h-6 w-6 text-white/70" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher un élève..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  aria-label="Rechercher un élève"
                />
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                      <GanttChartSquare className="h-7 w-7 text-indigo-600" />
                      <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                        Gestion des Évaluations
                      </span>
                    </h2>
                  </div>
                  {/* Bouton Imprimer */}
                  <div
                    onClick={() => setShowPrintView(true)}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded cursor-pointer"
                  >
                    Imprimer
                  </div>
                </div>
              </div>
              <ul className="divide-y divide-gray-100">
                {filteredStudents.map((student) => (
                  <li
                    key={student.id}
                    onClick={!isComptable ? () => {
                      setSelectedStudent(student);
                    } : undefined}
                    className={`group p-4 transition-colors duration-200 ${!isComptable ? "hover:bg-indigo-50/50 cursor-pointer" : ""}`}
                  >
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="bg-indigo-100 p-2.5 rounded-xl shadow-sm">
                          <UserCircle className="h-8 w-8 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate uppercase">
                            {student.displayName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs sm:text-sm text-indigo-600/80 font-medium">
                              {student.email}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
                {filteredStudents.length === 0 && (
                  <li className="p-12 text-center">
                    <div className="flex flex-col items-center gap-4 text-gray-400">
                      <Search className="h-14 w-14" />
                      <div className="space-y-1">
                        <h3 className="text-xl font-semibold">Aucun élève trouvé</h3>
                        <p className="text-gray-500">
                          Aucun résultat pour "{searchTerm}"
                        </p>
                      </div>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
