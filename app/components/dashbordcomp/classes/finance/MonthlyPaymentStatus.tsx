"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Check, X, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { firestore } from "@/config/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { Payment, PaymentSettings } from "./finance";
import Legend from "./Legend";
import MonthCard from "./MonthCard";
import InfoCard from "./InfoCard";

interface MonthlyPaymentStatusProps {
  payments: Payment[];
  classe: string;
  schoolId: string;
  studentId: string; // Nouvelle prop pour l'ID de l'étudiant
}

const SCHOOL_MONTHS = [
  "Septembre", "Octobre", "Novembre", "Décembre",
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin"
] as const;

type MonthStatus = "paid" | "partial" | "unpaid" | "current" | "future";

interface MonthPaymentInfo {
  status: MonthStatus;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
}

const MonthlyPaymentStatus: React.FC<MonthlyPaymentStatusProps> = ({
  payments,
  classe,
  schoolId,
  studentId, // Nouvelle prop
}) => {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentDate = useMemo(() => new Date(), []);
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Fonction pour calculer les dates d'échéance
  const calculateDueDates = useCallback((year: string) => {
    const [startYear, endYear] = year.split('-').map(Number);
    const dueDay = 15;
    return SCHOOL_MONTHS.map((_, index) => {
      const monthIndex = index < 4 ? index + 8 : index - 4;
      const year = index < 4 ? startYear : endYear;
      return new Date(year, monthIndex, dueDay);
    });
  }, []);

  const fetchPaymentSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const settingsRef = collection(firestore, "schools", schoolId, "payements");
      const q = query(settingsRef, where("class", "==", classe));
      const snap = await getDocs(q);
      if (snap.empty) {
        throw new Error("Aucune configuration de paiement trouvée pour cette classe.");
      }
      const data = snap.docs[0].data();
      const year = data.year || `${currentYear}-${currentYear + 1}`;
      const dueDates = calculateDueDates(year);
      const parsedSettings: PaymentSettings = {
        year,
        class: data.class,
        annualAmount: Number(data.annualAmount) || 0,
        quarterlyAmount: Number(data.quarterlyAmount) || 0,
        monthlyAmount: Number(data.monthlyAmount) || 0,
        currency: data.currency || "CDF",
        enrollmentFee: Number(data.enrollmentFee) || 0,
        latePaymentFee: Number(data.latePaymentFee) || 0,
        dueDates,
        schoolId,
      };
      setSettings(parsedSettings);
    } catch (err) {
      console.error("Erreur lors de la récupération des paramètres:", err);
      setError(err instanceof Error ? err.message : "Une erreur inconnue est survenue");
    } finally {
      setLoading(false);
    }
  }, [classe, schoolId, currentYear, calculateDueDates]);

  useEffect(() => {
    if (classe && schoolId) fetchPaymentSettings();
  }, [classe, schoolId, fetchPaymentSettings]);

  // Calcul des paiements par mois avec statuts
  const monthsPaymentInfo = useMemo(() => {
    if (!settings) return {};
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const monthlyAmount = settings.monthlyAmount;
    let remainingPaid = totalPaid;
    const today = new Date();
    return SCHOOL_MONTHS.reduce((acc, _, index) => {
      const dueDate = settings.dueDates[index];
      const formattedDueDate = dueDate.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      let paidAmount = 0;
      if (remainingPaid > 0) {
        paidAmount = Math.min(monthlyAmount, remainingPaid);
        remainingPaid -= paidAmount;
      }
      let status: MonthStatus;
      if (dueDate < today) {
        status = paidAmount >= monthlyAmount ? "paid" :
          paidAmount > 0 ? "partial" : "unpaid";
      } else if (
        dueDate.getMonth() === today.getMonth() &&
        dueDate.getFullYear() === today.getFullYear()
      ) {
        status = "current";
      } else {
        status = "future";
      }
      acc[index] = {
        status,
        paidAmount,
        remainingAmount: Math.max(0, monthlyAmount - paidAmount),
        dueDate: formattedDueDate,
      };
      return acc;
    }, {} as Record<number, MonthPaymentInfo>);
  }, [payments, settings]);

  // Fonction pour mettre à jour le statut de paiement de l'étudiant
  const updateStudentPaymentStatus = useCallback(async (isPaid: boolean) => {
    try {
      const studentRef = doc(firestore, "users", studentId);
      await updateDoc(studentRef, { paiement: isPaid });
    } catch (err) {
      console.error("Erreur lors de la mise à jour du statut de paiement:", err);
    }
  }, [studentId]);

  // Synchroniser le statut de paiement avec Firestore
  useEffect(() => {
    if (!settings || !studentId) return;

    const currentMonthIndex = SCHOOL_MONTHS.findIndex((_, index) => {
      const dueDate = settings.dueDates[index];
      const now = new Date();
      return dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear();
    });

    const currentMonthInfo = monthsPaymentInfo[currentMonthIndex];
    if (currentMonthInfo) {
      const isPaid = currentMonthInfo.status === "paid";
      updateStudentPaymentStatus(isPaid);
    }
  }, [monthsPaymentInfo, settings, studentId, updateStudentPaymentStatus]);

  // Statistiques globales
  const { totalPaid, remaining } = useMemo(() => {
    if (!settings) return { totalPaid: 0, remaining: 0 };
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalDue = settings.monthlyAmount * SCHOOL_MONTHS.length;
    return {
      totalPaid: total,
      remaining: totalDue - total
    };
  }, [payments, settings]);

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-3 text-gray-500">
        <Loader2 className="animate-spin" size={24} />
        <p>Chargement des données de paiement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
        <div className="flex items-start gap-2">
          <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Erreur de chargement</p>
            <p>{error}</p>
            <button
              onClick={fetchPaymentSettings}
              className="mt-2 text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
            >
              <RefreshCw size={14} />
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded">
        <div className="flex items-start gap-2">
          <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
          <p>Configuration de paiement introuvable pour cette classe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <header className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Statut des paiements mensuels</h2>
        <p className="text-sm text-gray-500">Année scolaire {settings.year}</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <InfoCard
          title="Total annuel"
          value={settings.annualAmount}
          currency={settings.currency}
          variant="info"
        />
        <InfoCard
          title="Total payé"
          value={totalPaid}
          currency={settings.currency}
          variant="success"
        />
        <InfoCard
          title={remaining > 0 ? "Reste à payer" : remaining < 0 ? "Surplus" : "Paiement complet"}
          value={Math.abs(remaining)}
          currency={settings.currency}
          variant={remaining > 0 ? "warning" : remaining < 0 ? "error" : "success"}
        />
      </div>
      <section className="mb-6">
        <h3 className="font-medium text-gray-700 mb-3">Détail des paiements par mois</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {SCHOOL_MONTHS.map((month, index) => {
            const monthInfo = monthsPaymentInfo[index];
            if (!monthInfo) return null;
            return (
              <MonthCard
                key={month}
                month={month}
                amount={settings.monthlyAmount}
                paidAmount={monthInfo.paidAmount}
                remainingAmount={monthInfo.remainingAmount}
                currency={settings.currency}
                dueDate={monthInfo.dueDate}
                status={monthInfo.status}
                isHighlighted={monthInfo.status === "current"}
              />
            );
          })}
        </div>
      </section>
      <Legend />
    </div>
  );
};




export default MonthlyPaymentStatus;