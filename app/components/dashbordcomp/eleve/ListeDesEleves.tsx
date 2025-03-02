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
}

export default function ListeDesEleves({ selectedClass = "7eme" }: ListeDesElevesProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [checkedStates, setCheckedStates] = useState<{ [key: string]: boolean }>({});
  const [showBulletin, setShowBulletin] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);

  useEffect(() => {
    const fetchSchoolInfo = async () => {
      const schoolId = auth.currentUser?.uid;
      if (!schoolId) {
        console.error("Aucune école connectée");
        return;
      }
      try {
        const schoolDocRef = doc(firestore, "schools", schoolId);
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

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const schoolId = auth.currentUser?.uid;
        if (!schoolId) throw new Error("Aucune école connectée");

        const usersRef = collection(firestore, "users");
        const q = query(
          usersRef,
          where("role", "==", "élève"),
          where("schoolId", "==", schoolId),
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

  const handleCheckboxChange = async (studentId: string) => {
    const originalState = checkedStates[studentId];
    const newState = !originalState;
    
    // Mise à jour optimiste
    setCheckedStates(prev => ({ ...prev, [studentId]: newState }));
    
    try {
      const studentDocRef = doc(firestore, "users", studentId);
      await updateDoc(studentDocRef, { paiement: newState });
    } catch (e) {
      console.error("Erreur lors de la mise à jour du paiement :", e);
      // Revenir en arrière en cas d'erreur
      setCheckedStates(prev => ({ ...prev, [studentId]: originalState }));
      setError("Échec de la mise à jour du statut de paiement");
    }
  };

  // Débouncer la recherche pour limiter les recalculs
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Mémoriser le filtrage
  const filteredStudents = useMemo(() => {
    return students.filter(student =>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-8">
      {selectedStudent ? (
        <div className="container mx-auto px-4">
          {showBulletin ? (
            <div>
              <button
                onClick={() => setShowBulletin(false)}
                className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Retour au profil
              </button>
              <BulletinAffiche
                selectedStudent={selectedStudent}
                schoolInfo={schoolInfo || dummySchoolInfo}
              />
            </div>
          ) : (
            <div>
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => setShowBulletin(true)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                >
                  Afficher Bulletin
                </button>
              </div>
              <ProfileEleve
                {...selectedStudent}
                onRetour={() => {
                  setSelectedStudent(null);
                  setShowBulletin(false);
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="container mx-auto px-4">
          <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-3xl">
            <div className="bg-gradient-to-br from-blue-700 to-indigo-800 p-8 relative">
              <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <School className="h-12 w-12 text-white/90" />
                  <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
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
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                    <GanttChartSquare className="h-7 w-7 text-indigo-600" />
                    <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                      Gestion des Évaluations
                    </span>
                  </h2>
                </div>
                <ul className="divide-y divide-gray-100">
                  {filteredStudents.map((student) => (
                    <li
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className="group p-4 hover:bg-indigo-50/50 cursor-pointer transition-colors duration-200"
                    >
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="bg-indigo-100 p-2.5 rounded-xl shadow-sm">
                            <UserCircle className="h-8 w-8 text-indigo-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {student.displayName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-indigo-600/80 font-medium">
                                {student.email}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <label
                            className="relative flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={checkedStates[student.id] || false}
                              onChange={() => handleCheckboxChange(student.id)}
                              className="peer absolute opacity-0 h-0 w-0"
                            />
                            <div className="w-8 h-8 flex justify-center items-center border-2 border-indigo-200 rounded-lg bg-white text-indigo-300 transition-all peer-checked:bg-indigo-600 peer-checked:border-indigo-600 peer-checked:text-white peer-focus:ring-2 peer-focus:ring-indigo-300">
                              <CheckCheck className="h-5 w-5 transition-opacity opacity-0 peer-checked:opacity-100" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">
                              {checkedStates[student.id]
                                ? "Pas encore payé"
                                : "Paiement effectué"}
                            </span>
                          </label>
                          <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-indigo-600 ml-4 transition-colors" />
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
      )}
    </div>
  );
}
