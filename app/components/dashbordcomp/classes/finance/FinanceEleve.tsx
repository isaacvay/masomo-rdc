"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { Plus, Printer } from "lucide-react";
import { auth, firestore } from "@/config/firebase";
import { doc, getDoc, collection, query, where, getDocs, Timestamp, DocumentData } from "firebase/firestore";
import { FinanceEleveProps, Payment } from "./finance";
import MonthlyPaymentStatus from "./MonthlyPaymentStatus";
import PaymentForm from "./PaymentForm";
import PaymentHistory from "./PaymentHistory";

const FinanceEleve: React.FC<FinanceEleveProps> = ({
  student,
  classe,
  schoolId,
  onRetour,
}) => {
  const [paymentStatus, setPaymentStatus] = useState<boolean>(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudentData = useCallback(async () => {
    try {
      const [userDoc, paymentsSnap] = await Promise.all([
        getDoc(doc(firestore, "users", student.id)),
        getDocs(query(
          collection(firestore, "schools", schoolId, "payements"),
          where("studentId", "==", student.id),
          where("classe", "==", classe)
        ))
      ]);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setPaymentStatus(!!data?.paiement);
      }

      const paymentsData: Payment[] = paymentsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
          amount: data.amount,
          method: data.method,
          reference: data.reference,
          recordedBy: data.recordedBy,
        };
      });

      setPayments(paymentsData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Impossible de charger les données financières. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }, [student.id, classe, schoolId]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const handlePaymentSuccess = useCallback((newPayment: Payment) => {
    setPaymentStatus(true);
    setPayments(prev => [newPayment, ...prev]);
    setSuccess(`Paiement enregistré (réf. ${newPayment.reference}) avec succès`);
    setShowPaymentForm(false);
    setTimeout(() => setSuccess(null), 5000);
  }, []);

  const resetMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 bg-gray-100 rounded-lg flex justify-center items-center min-h-[200px]">
        <div className="animate-pulse text-gray-500">Chargement des données...</div>
      </div>
    );
  }

  if (showPaymentForm) {
    return (
      <PaymentForm
        student={student}
        schoolId={schoolId}
        classe={classe}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setShowPaymentForm(false)}
      />
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gray-50 rounded-lg space-y-4 sm:space-y-6">
      {/* Header with back button and actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <button
          onClick={onRetour}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors duration-200 w-full sm:w-auto justify-center sm:justify-start"
          aria-label="Retour à la liste"
        >
          <FaArrowLeft className="text-sm sm:text-base" /> 
          <span className="text-sm sm:text-base">Retour</span>
        </button>

        <div className="flex gap-2 sm:gap-3 justify-center sm:justify-end">
          <button
            onClick={() => setShowPaymentForm(true)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors duration-200  w-full sm:w-auto text-sm sm:text-base"
            aria-label="Ajouter un nouveau paiement"
          >
            <Plus size={16} /> 
            <span>Nouveau paiement</span>
          </button>
        </div>
      </div>

      {/* Student header */}
      <header className="space-y-1 sm:space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Détails financiers de {student.displayName}
        </h1>
        <p className="text-sm sm:text-base text-gray-600">{classe}</p>
      </header>

      <div className="space-y-4 sm:space-y-6">
        {/* Payment status section */}
        <section className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h3 className="font-semibold text-gray-500 text-xs sm:text-sm">Statut de paiement</h3>
              <p className={`font-medium ${paymentStatus ? "text-green-600" : "text-red-600"} text-sm sm:text-base`}>
                {paymentStatus ? "À jour" : "En attente de paiement"}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-500 text-xs sm:text-sm">Email</h3>
              <p className="text-gray-800 text-sm sm:text-base">{student.email || "Non renseigné"}</p>
            </div>
          </div>

          <MonthlyPaymentStatus 
            payments={payments} 
            classe={classe} 
            schoolId={schoolId} 
            studentId={student.id} 
          />
        </section>

        {/* Payment history section */}
        <section className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-sm border border-gray-100 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Historique des paiements</h2>
            {payments.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full">
                {payments.length} paiement{payments.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <PaymentHistory payments={payments} />

          {/* Status messages */}
          {(error || success) && (
            <div 
              className={`p-3 sm:p-4 border-l-4 flex justify-between items-center text-sm sm:text-base ${
                error ? "bg-red-50 border-red-500 text-red-700" : "bg-green-50 border-green-500 text-green-700"
              }`}
              role="alert"
            >
              <span>{error || success}</span>
              <button 
                onClick={resetMessages} 
                className={`ml-2 ${error ? "text-red-700 hover:text-red-900" : "text-green-700 hover:text-green-900"}`}
              >
                ×
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default FinanceEleve;
