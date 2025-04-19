"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { CheckCheck, DollarSign, Plus, Printer } from "lucide-react";
import { auth, firestore } from "@/config/firebase";
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { FinanceEleveProps, Payment } from "./finance";
import MonthlyPaymentStatus from "./MonthlyPaymentStatus";
import PaymentForm from "./PaymentForm";
import PaymentHistory from "./PaymentHistory";
import ReactDOM from "react-dom";

interface SchoolInfo {
  nom: string;
  email?: string;
  address?: string;
  phone?: string;
  logo?: string;
}

interface Student {
  id: string;
  displayName: string;
  email?: string;
}

interface InvoiceData {
  payment: Payment;
  student: Student;
  classe: string;
  school: SchoolInfo | null;
  recordedBy: string;
}

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
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);

  // Fetch school info
  useEffect(() => {
    const fetchSchoolInfo = async () => {
      try {
        const schoolDoc = await getDoc(doc(firestore, "schools", schoolId));
        if (schoolDoc.exists()) {
          setSchoolInfo(schoolDoc.data() as SchoolInfo);
        }
      } catch (err) {
        console.error("Error fetching school info:", err);
      }
    };

    fetchSchoolInfo();
  }, [schoolId]);

  // Fetch student data and payments
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

  // Handle payment success
  const handlePaymentSuccess = useCallback((newPayment: Payment) => {
    setPaymentStatus(true);
    setPayments(prev => [newPayment, ...prev]);
    setSuccess(`Paiement enregistré (réf. ${newPayment.reference}) avec succès`);
    setShowPaymentForm(false);
    
    // Prepare invoice data
    setInvoiceData({
      payment: newPayment,
      student,
      classe,
      school: schoolInfo,
      recordedBy: auth.currentUser?.displayName || auth.currentUser?.email || "Administrateur",
    });
    
    setShowInvoice(true);
    setTimeout(() => setSuccess(null), 5000);
  }, [schoolInfo, student]);

  // Reset messages
  const resetMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  // Print invoice
  const handlePrintInvoice = () => {
    if (!invoiceData) return;

    const invoiceWindow = window.open('', '_blank');
    if (invoiceWindow) {
      const invoiceContent = `
        <html>
          <head>
            <title>Facture de paiement - ${invoiceData.student.displayName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .invoice-container { max-width: 800px; margin: 0 auto; }
              .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .school-info { flex: 1; }
              .invoice-title { text-align: center; margin: 30px 0; font-size: 24px; }
              .invoice-details { margin-bottom: 30px; }
              .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
              .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .table th, .table td { padding: 10px; border: 1px solid #ddd; text-align: left; }
              .table th { background-color: #f5f5f5; }
              .total { font-weight: bold; text-align: right; margin-top: 20px; font-size: 18px; }
              .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <div class="header">
                <div class="school-info">
                  <h2>${invoiceData.school?.nom || 'École'}</h2>
                  ${invoiceData.school?.email ? `<p>${invoiceData.school.email}</p>` : ''}
                  ${invoiceData.school?.address ? `<p>${invoiceData.school.address}</p>` : ''}
                  ${invoiceData.school?.phone ? `<p>Tél: ${invoiceData.school.phone}</p>` : ''}
                </div>
                <div>
                  <h3>FACTURE</h3>
                  <p>Référence: ${invoiceData.payment.reference}</p>
                  <p>Date: ${invoiceData.payment.date.toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              <div class="invoice-title">RECU DE PAIEMENT</div>

              <div class="invoice-details">
                <div class="details-grid">
                  <div>
                    <p><strong>Élève:</strong> ${invoiceData.student.displayName}</p>
                    <p><strong>Classe:</strong> ${invoiceData.classe}</p>
                  </div>
                  <div>
                    <p><strong>Enregistré par:</strong> ${invoiceData.recordedBy}</p>
                    <p><strong>Date d'enregistrement:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </div>

              <table class="table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Montant (CDF)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Paiement scolaire</td>
                    <td>${invoiceData.payment.amount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div class="total">
                TOTAL: ${invoiceData.payment.amount.toLocaleString()} CDF
              </div>

              <div class="footer">
                <p>Merci pour votre confiance</p>
                <p>Ce document fait office de facture officielle</p>
              </div>
            </div>
          </body>
        </html>
      `;
      
      invoiceWindow.document.write(invoiceContent);
      invoiceWindow.document.close();
      setTimeout(() => {
        invoiceWindow.print();
      }, 500);
    }
  };

  // Invoice popup component
  const InvoicePopup = () => {
    if (!showInvoice || !invoiceData) return null;

    return ReactDOM.createPortal(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold uppercase">{invoiceData.school?.nom || 'École'}</h2>
                {invoiceData.school?.email && <p className="text-sm">{invoiceData.school.email}</p>}
                {invoiceData.school?.address && <p className="text-sm">{invoiceData.school.address}</p>}
                {invoiceData.school?.phone && <p className="text-sm">Tél: {invoiceData.school.phone}</p>}
              </div>
              <div className="text-right">
                <h3 className="text-lg font-semibold">FACTURE</h3>
                <p className="text-sm">Réf: {invoiceData.payment.reference}</p>
                <p className="text-sm">Date: {invoiceData.payment.date.toLocaleDateString('fr-FR')}</p>
              </div>
            </div>

            <h2 className="text-center text-2xl font-bold my-6">RECU DE PAIEMENT</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p><strong>Élève:</strong> {invoiceData.student.displayName}</p>
                <p><strong>Classe:</strong> {invoiceData.classe}</p>
              </div>
              <div>
                <p><strong>Enregistré par:</strong> {invoiceData.recordedBy}</p>
                <p><strong>Date:</strong> {new Date().toLocaleDateString('fr-FR')}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">Description</th>
                    <th className="border px-4 py-2 text-left">Montant (CDF)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-4 py-2">Paiement scolaire</td>
                    <td className="border px-4 py-2">{invoiceData.payment.amount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-right mt-4 text-lg font-bold">
              TOTAL: {invoiceData.payment.amount.toLocaleString()} CDF
            </div>

            <div className="mt-8 text-center text-sm text-gray-500">
              <p>Merci pour votre confiance</p>
              <p>Ce document fait office de facture officielle</p>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowInvoice(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Fermer
              </button>
              <button
                onClick={handlePrintInvoice}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <Printer size={18} /> Imprimer
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

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
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors duration-200 w-full sm:w-auto text-sm sm:text-base"
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
                {paymentStatus ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCheck className="h-4 w-4" /> <span className="hidden sm:inline">Payé</span>
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" /> <span className="hidden sm:inline">En attente de paiement</span>
                  </span>
                )}
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
      {/* Invoice Popup */}
      <InvoicePopup />
    </div>
  );
};

export default FinanceEleve;
