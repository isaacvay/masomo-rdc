"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Check, X, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { firestore } from "@/config/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { Payment, PaymentSettings } from "./finance";
import Legend from "./Legend";
import MonthCard from "./MonthCard";
import InfoCard from "./InfoCard";

interface MonthlyPaymentStatusProps {
  payments: Payment[];
  classe: string;
  schoolId: string;
  studentId: string;
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
  studentId,
}) => {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayments, setProcessingPayments] = useState(false);
  const currentDate = useMemo(() => new Date(), []);
  const currentYear = currentDate.getFullYear();
  const initializedRef = useRef(false);
  const [remainingUntilCurrent, setRemainingUntilCurrent] = useState(0);

  const calculateDueDates = useCallback((year: string) => {
    const [startYear, endYear] = year.split('-').map(Number);
    const dueDay = 15;
    return SCHOOL_MONTHS.map((_, index) => {
      const monthIndex = index < 4 ? index + 8 : index - 4;
      const year = index < 4 ? startYear : endYear;
      return new Date(year, monthIndex, dueDay);
    });
  }, []);

  const updateRemainingBalance = useCallback(async (remaining: number) => {
    try {
      const studentRef = doc(firestore, "schools", schoolId, "students", studentId);
      await updateDoc(studentRef, {
        "paymentStatus.remainingUntilCurrent": remaining,
        "paymentStatus.lastUpdated": serverTimestamp(),
        "paymentStatus.schoolYear": settings?.year || `${currentYear}-${currentYear + 1}`
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du solde restant:", error);
    }
  }, [schoolId, studentId, settings, currentYear]);

  const updateOrCreatePayment = useCallback(async (
    amount: number, 
    month: string, 
    year: string,
    dueDate: Date
  ) => {
    try {
      const paymentsRef = collection(firestore, "schools", schoolId, "students", studentId, "payments");
      const q = query(
        paymentsRef, 
        where("month", "==", month), 
        where("year", "==", year)
      );
      const querySnapshot = await getDocs(q);

      let updated = false;

      if (!querySnapshot.empty) {
        const paymentDoc = querySnapshot.docs[0];
        const existingAmount = paymentDoc.data().amount || 0;
        
        if (Math.abs(existingAmount - amount) > 0.01) {
          await updateDoc(
            doc(firestore, "schools", schoolId, "students", studentId, "payments", paymentDoc.id), 
            {
              amount: amount,
              updatedAt: serverTimestamp(),
              dueDate: dueDate,
              status: amount > 0 ? "completed" : "pending"
            }
          );
          updated = true;
        }
      } else {
        if (amount > 0) {
          await addDoc(paymentsRef, {
            amount: amount,
            month: month,
            year: year,
            currency: settings?.currency || "CDF",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            status: "completed",
            type: "monthly",
            dueDate: dueDate,
            studentId: studentId,
            schoolId: schoolId,
            class: classe
          });
          updated = true;
        }
      }

      return updated;
    } catch (error) {
      console.error(`Error processing payment for ${month} ${year}:`, error);
      throw error;
    }
  }, [schoolId, studentId, classe, settings]);

  const processMonthlyPayments = useCallback(async (settings: PaymentSettings) => {
    if (processingPayments) return false;

    setProcessingPayments(true);
    try {
      const today = new Date();
      const currentMonthIndex = SCHOOL_MONTHS.findIndex((_, index) => {
        const dueDate = settings.dueDates[index];
        return dueDate.getMonth() === today.getMonth() && 
              dueDate.getFullYear() === today.getFullYear();
      });

      const monthsToProcess = currentMonthIndex !== -1 
        ? currentMonthIndex + 1 
        : SCHOOL_MONTHS.filter((_, index) => settings.dueDates[index] <= today).length;

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const monthlyAmount = settings.monthlyAmount;
      let remainingPaid = totalPaid;
      let updatesMade = false;

      for (let i = 0; i < monthsToProcess; i++) {
        const monthName = SCHOOL_MONTHS[i];
        const dueDate = settings.dueDates[i];
        const year = dueDate.getFullYear().toString();

        const paidAmount = Math.min(monthlyAmount, remainingPaid);
        remainingPaid -= paidAmount;

        const updateResult = await updateOrCreatePayment(paidAmount, monthName, year, dueDate);
        if (updateResult) updatesMade = true;
      }

      // Calcul du reste jusqu'au mois actuel
      const totalDueUntilCurrent = settings.monthlyAmount * monthsToProcess;
      const newRemainingUntilCurrent = Math.max(0, totalDueUntilCurrent - totalPaid);
      setRemainingUntilCurrent(newRemainingUntilCurrent);

      // Mise à jour dans Firestore
      if (updatesMade) {
        await updateRemainingBalance(newRemainingUntilCurrent);
      }

      return updatesMade;
    } catch (error) {
      console.error("Error processing monthly payments:", error);
      return false;
    } finally {
      setProcessingPayments(false);
    }
  }, [payments, updateOrCreatePayment, processingPayments, updateRemainingBalance]);

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
      
      if (!initializedRef.current) {
        initializedRef.current = true;
        await processMonthlyPayments(parsedSettings);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des paramètres:", err);
      setError(err instanceof Error ? err.message : "Une erreur inconnue est survenue");
    } finally {
      setLoading(false);
    }
  }, [classe, schoolId, currentYear, calculateDueDates, processMonthlyPayments]);

  useEffect(() => {
    if (classe && schoolId && !initializedRef.current) {
      fetchPaymentSettings();
    }
  }, [classe, schoolId, fetchPaymentSettings]);

  // Calcul des statistiques financières
  const { 
    totalPaid, 
    remainingTotal, 
    monthsDueCount,
    monthsDueUntilCurrentCount
  } = useMemo(() => {
    if (!settings) return { 
      totalPaid: 0, 
      remainingTotal: 0,
      monthsDueCount: 0,
      monthsDueUntilCurrentCount: 0
    };
    
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const today = new Date();
    
    const totalDue = settings.monthlyAmount * SCHOOL_MONTHS.length;
    const remainingTotal = Math.max(0, totalDue - totalPaid);
    
    let lastMonthIndex = SCHOOL_MONTHS.findIndex((_, index) => {
      const dueDate = settings.dueDates[index];
      return dueDate.getMonth() === today.getMonth() && 
             dueDate.getFullYear() === today.getFullYear();
    });

    if (lastMonthIndex === -1) {
      lastMonthIndex = SCHOOL_MONTHS.reduce((lastIndex, _, index) => {
        const dueDate = settings.dueDates[index];
        return dueDate < today ? index : lastIndex;
      }, -1);
    }

    const monthsDueUntilCurrentCount = lastMonthIndex + 1;

    return {
      totalPaid,
      remainingTotal,
      monthsDueCount: SCHOOL_MONTHS.length,
      monthsDueUntilCurrentCount
    };
  }, [payments, settings]);

  const currentSchoolMonth = useMemo(() => {
    if (!settings) return null;
    
    const today = new Date();
    const currentMonthIndex = SCHOOL_MONTHS.findIndex((_, index) => {
      const dueDate = settings.dueDates[index];
      return dueDate.getMonth() === today.getMonth() && 
             dueDate.getFullYear() === today.getFullYear();
    });

    return currentMonthIndex !== -1 ? SCHOOL_MONTHS[currentMonthIndex] : null;
  }, [settings]);

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
        <p className="text-sm text-gray-500">
          Année scolaire {settings.year}
          {currentSchoolMonth && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
              Mois en cours : {currentSchoolMonth}
            </span>
          )}
          {processingPayments && (
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs flex items-center">
              <Loader2 className="animate-spin mr-1" size={14} />
              Mise à jour des paiements...
            </span>
          )}
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
          title={currentSchoolMonth ? `Reste jusqu'à ${currentSchoolMonth}` : "Reste jusqu'au mois actuel"}
          value={remainingUntilCurrent}
          currency={settings.currency}
          variant={remainingUntilCurrent > 0 ? "warning" : "success"}
          description={`Sur ${settings.monthlyAmount * monthsDueUntilCurrentCount} ${settings.currency}`}
        />
        <InfoCard
          title="Reste total à payer"
          value={remainingTotal}
          currency={settings.currency}
          variant={remainingTotal > 0 ? "warning" : "success"}
          description={`Sur ${settings.monthlyAmount * monthsDueCount} ${settings.currency}`}
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
