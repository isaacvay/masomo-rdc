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
  getDoc 
} from "firebase/firestore";
import { Search, AlertCircle, Loader2, Filter, RefreshCw, CheckCheck, DollarSign, Printer } from "lucide-react";
import { FaArrowLeft } from "react-icons/fa";
import FinanceEleve from "./FinanceEleve";

interface Student {
  id: string;
  displayName: string;
  email: string;
  classe: string;
  paiement?: boolean;
  schoolId: string;
  paymentStatus?: {
    remainingUntilCurrent?: number;
    lastUpdated?: any;
    schoolYear?: string;
  };
}

interface FinanceStudentsProps {
  selectedClass: string;
  onRetour?: () => void;
}

type PaymentFilter = 'all' | 'paid' | 'pending';

const FinanceStudents: React.FC<FinanceStudentsProps> = ({ selectedClass, onRetour }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedStates, setCheckedStates] = useState<{ [key: string]: boolean }>({});
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');

  const fetchStudents = useCallback(async () => {
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

      const studentsData = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const studentData = docSnap.data() as Omit<Student, "id">;
        
        const studentDoc = await getDoc(doc(firestore, "schools", effectiveSchoolId, "students", docSnap.id));
        const paymentStatus = studentDoc.exists() ? studentDoc.data()?.paymentStatus : null;

        return { 
          id: docSnap.id, 
          ...studentData,
          paymentStatus: paymentStatus || {}
        };
      }));

      const initialCheckedStates: { [key: string]: boolean } = {};
      studentsData.forEach(student => {
        initialCheckedStates[student.id] = student.paiement || false;
      });

      setStudents(studentsData);
      setCheckedStates(initialCheckedStates);
    } catch (err) {
      console.error("Erreur lors de la récupération des élèves :", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

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
    fetchStudents();
  };

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchStudents();
  };

  const filteredStudents = useMemo(() => {
    let result = students.filter((student) =>
      student.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (paymentFilter === 'paid') {
      result = result.filter(student => checkedStates[student.id]);
    } else if (paymentFilter === 'pending') {
      result = result.filter(student => !checkedStates[student.id]);
    }

    return result;
  }, [students, searchTerm, checkedStates, paymentFilter]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printContent = `
        <html>
          <head>
            <title>Liste des élèves - ${selectedClass}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #1a365d; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #f7fafc; text-align: left; padding: 8px; border-bottom: 1px solid #e2e8f0; }
              td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
              .header { margin-bottom: 20px; text-align: center; }
              .date { text-align: right; font-size: 0.9em; color: #718096; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Liste des élèves - ${selectedClass}</h1>
              <div class="date">Généré le ${new Date().toLocaleDateString('fr-FR')}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Solde</th>
                </tr>
              </thead>
              <tbody>
                ${filteredStudents.map((student, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${student.displayName}</td>
                    <td>${student.email}</td>
                    <td>${student.paymentStatus?.remainingUntilCurrent?.toLocaleString() || '0'} CDF</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 200);
      };
    }
  }, [filteredStudents, selectedClass]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-gray-600 font-medium">Chargement des élèves...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </button>
        </div>
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
    <div className="space-y-6">
       {/* Header */}
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion Financière</h1>
          <p className="text-sm text-gray-500 mt-1">
            Classe: <span className="font-medium text-gray-700">{selectedClass}</span>
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={handlePrint}
            className="flex items-center py-2 px-3 rounded-lg  bg-gray-200 hover:bg-gray-300 transition-colors"
            title="Imprimer la liste"
          >
            <Printer className="h-5 w-5 text-gray-600" /> <span className="ml-2">Imprimer</span>
          </button>
          
          <button 
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Actualiser"
          >
            <RefreshCw className="h-5 w-5 text-gray-600" />
          </button>
          
          {onRetour && (
            <button
              onClick={onRetour}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative rounded-lg shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un élève..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="paid">Payé</option>
            <option value="pending">En attente</option>
          </select>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white shadow overflow-hidden rounded-xl">
        {/* Desktop Header */}
        <div className="hidden md:grid md:grid-cols-12 bg-gray-50 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
          <div className="col-span-5">Élève</div>
          <div className="col-span-4">Solde</div>
          <div className="col-span-3">Statut de paiement</div>
        </div>

        {filteredStudents.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <li 
                key={student.id} 
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleStudentClick(student)}
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-0 items-center">
                   {/* Student Info */}
                    <div className="flex items-center min-w-0 md:col-span-5">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 font-medium shadow-inner">
                        {student.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4 min-w-0">
                        <div className="flex items-center space-x-1">
                          <p className="text-base uppercase font-semibold text-gray-900 truncate">
                            {student.displayName}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {student.email}
                        </p>
                      </div>
                    </div>
                    
                    {/* Balance */}
                    <div className="md:col-span-4">
                      {student.paymentStatus?.remainingUntilCurrent !== undefined ? (
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-1.5 rounded-md text-lg w-40 font-medium ${
                            student.paymentStatus.remainingUntilCurrent > 0 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {student.paymentStatus.remainingUntilCurrent.toLocaleString()} CDF
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Non disponible</span>
                      )}
                    </div>

                    {/* Payment Status */}
                    <div className="md:col-span-3">
                      <div 
                        className="flex items-center justify-end md:justify-start"
                        onClick={(e) => handleCheckboxChange(student.id, e)}
                      >
                        <label className="inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={checkedStates[student.id] || false}
                            readOnly
                          />
                          <div className={`relative w-11 h-6 rounded-full peer ${
                            checkedStates[student.id] 
                              ? 'bg-green-500 peer-focus:ring-green-300' 
                              : 'bg-gray-200 peer-focus:ring-gray-300'
                          } peer-focus:ring-2 peer-focus:outline-none transition-colors`}>
                            <div className={`absolute top-0.5 left-[2px] bg-white border-gray-300 rounded-full h-5 w-5 transition-transform ${
                              checkedStates[student.id] ? 'translate-x-full' : ''
                            }`}></div>
                          </div>
                          <span className={`ml-2 text-sm font-medium ${
                            checkedStates[student.id] ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {checkedStates[student.id] ?  (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCheck className="h-4 w-4" /> <span className="hidden sm:inline">Payé</span>
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1">
                            <DollarSign className="h-4 w-4" /> <span className="hidden sm:inline">En attente</span>
                          </span>
                        )}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <Search className="h-full w-full" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun élève trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? `Aucun résultat pour "${searchTerm}"` 
                : 'Aucun élève ne correspond aux filtres sélectionnés'}
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="-ml-1 mr-2 h-4 w-4" />
                Actualiser la liste
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
        <div className="mb-2 md:mb-0">
          <span className="font-medium text-gray-700">{filteredStudents.length}</span> élève{filteredStudents.length !== 1 ? 's' : ''} {paymentFilter !== 'all' && `(${paymentFilter === 'paid' ? 'payés' : 'en attente'})`}
        </div>
        <div className="text-xs bg-gray-50 px-3 py-1 rounded-full">
          Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
        </div>
      </div>
    </div>
  );
};

export default FinanceStudents;
