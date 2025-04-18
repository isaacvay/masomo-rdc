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
    setPayments(prev => [newPayment, ...prev]); // Ajoute le nouveau paiement en tête de liste
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
      <div className="p-6 bg-gray-100 rounded-lg flex justify-center items-center h-64">
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
    <div className="p-4 md:p-6 bg-gray-50 rounded-lg space-y-6">
        <div className="flex justify-between">
      <button
        onClick={onRetour}
        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        aria-label="Retour à la liste"
      >
        <FaArrowLeft /> Retour
      </button>

       {/* Actions */}
       <div className="flex flex-wrap gap-3 pt-2">
            
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  aria-label="Ajouter un nouveau paiement"
                >
                  <Plus size={18} /> Nouveau paiement
                </button>
          </div>
          </div>
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-800">
          Détails financiers de {student.displayName}
        </h1>
        <p className="text-gray-600">{classe}</p>
      </header>

      <div className="space-y-6">
        {/* Section Statut et Paiements mensuels */}
        <section className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold text-gray-500 text-sm">Statut de paiement</h3>
              <p className={`font-medium ${paymentStatus ? "text-green-600" : "text-red-600"}`}>
                {paymentStatus ? "À jour" : "En attente de paiement"}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-500 text-sm">Email</h3>
              <p className="text-gray-800">{student.email || "Non renseigné"}</p>
            </div>
          </div>

          <MonthlyPaymentStatus 
            payments={payments} 
            classe={classe} 
            schoolId={schoolId} 
            studentId={student.id} 
          />
        </section>

        {/* Section Historique des paiements */}
        <section className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Historique des paiements</h2>
            {payments.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full">
                {payments.length} paiement{payments.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <PaymentHistory payments={payments} />

          {/* Messages d'état */}
          {error && (
            <div 
              className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex justify-between items-center"
              role="alert"
            >
              <span>{error}</span>
              <button onClick={resetMessages} className="text-red-700 hover:text-red-900">
                ×
              </button>
            </div>
          )}
          {success && (
            <div 
              className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex justify-between items-center"
              role="alert"
            >
              <span>{success}</span>
              <button onClick={resetMessages} className="text-green-700 hover:text-green-900">
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