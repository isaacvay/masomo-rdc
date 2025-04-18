"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { auth, firestore } from "@/config/firebase";
import { collection, doc, getDocs, query, where, updateDoc } from "firebase/firestore";
import { Search, AlertCircle, Loader2, CheckCheck, DollarSign } from "lucide-react";
import { FaArrowLeft } from "react-icons/fa";
import FinanceEleve from "./FinanceEleve";

interface Student {
  id: string;
  displayName: string;
  email: string;
  classe: string;
  paiement?: boolean;
  schoolId: string;
}

interface FinanceStudentsProps {
  selectedClass: string;
  onRetour?: () => void;
}

const FinanceStudents: React.FC<FinanceStudentsProps> = ({ selectedClass, onRetour }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedStates, setCheckedStates] = useState<{ [key: string]: boolean }>({});
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const effectiveSchoolId = auth.currentUser?.uid;
        if (!effectiveSchoolId) throw new Error("Aucune école connectée");

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

  const handleCheckboxChange = async (studentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const originalState = checkedStates[studentId];
    const newState = !originalState;

    setCheckedStates((prev) => ({ ...prev, [studentId]: newState }));

    try {
      const studentDocRef = doc(firestore, "users", studentId);
      await updateDoc(studentDocRef, { paiement: newState });
    } catch (e) {
      console.error("Erreur lors de la mise à jour du paiement :", e);
      setCheckedStates((prev) => ({ ...prev, [studentId]: originalState }));
      setError("Échec de la mise à jour du statut de paiement");
    }
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
  };

  const handleBackToList = () => {
    setSelectedStudent(null);
  };

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((student) =>
      student.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-600">
        <AlertCircle className="h-8 w-8 mb-4" />
        <h2 className="text-xl font-bold mb-2">Erreur</h2>
        <p className="text-center">{error}</p>
      </div>
    );
  }

  if (selectedStudent) {
    return (
      <FinanceEleve 
        student={selectedStudent} 
        classe={selectedClass}
        schoolId={selectedStudent.schoolId}
        onRetour={handleBackToList} 
      />
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-100 rounded-lg">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h2 className="text-lg md:text-xl font-bold">Gestion financière – {selectedClass}</h2>
        {onRetour && (
          <button
            onClick={onRetour}
            className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg w-full md:w-auto"
          >
            <FaArrowLeft /> <span>Retour</span>
          </button>
        )}
      </div>

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Rechercher un élève..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="hidden md:grid md:grid-cols-12 bg-gray-50 p-4 font-semibold border-b">
          <div className="col-span-6">Nom de l'élève</div>
          <div className="col-span-2 text-center">Statut paiement</div>
        </div>

        {filteredStudents.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <li 
                key={student.id} 
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleStudentClick(student)}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2 md:gap-0">
                  <div className="md:col-span-6 font-medium uppercase">{student.displayName}</div>
                  <div className="md:col-span-2 flex justify-start md:justify-center">
                    <div 
                      className="flex items-center gap-2"
                      onClick={(e) => handleCheckboxChange(student.id, e)}
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={checkedStates[student.id] || false}
                          onChange={() => {}}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </div>
                      <span className="text-sm">
                        {checkedStates[student.id] ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCheck className="h-4 w-4" /> <span className="hidden sm:inline">Payé</span>
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1">
                            <DollarSign className="h-4 w-4" /> <span className="hidden sm:inline">En attente</span>
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Search className="h-10 w-10 mx-auto mb-4" />
            <p>Aucun élève trouvé pour "{searchTerm}"</p>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Total: {filteredStudents.length} élève{filteredStudents.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default FinanceStudents;
