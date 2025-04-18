"use client";

import React, { useState, useEffect, useCallback } from "react";
import { auth, firestore } from "@/config/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

interface FinancePaymentsProps {
  selectedClass: string;
}

export interface PaymentSettings {
  year: string;
  class: string;
  annualAmount: number;
  quarterlyAmount: number;
  monthlyAmount: number;
  currency: string;
  enrollmentFee: number;
  latePaymentFee: number;
  paymentDeadlines: string[];
  schoolId: string;
  createdAt?: any;
}

const schoolYears = ["2023-2024", "2024-2025", "2025-2026"];
const currencies = [
  { code: "CDF", label: "Franc congolais" },
  { code: "USD", label: "Dollar US" },
];
const defaultDeadlines = ["15/09", "15/12", "15/03", "15/06"];

export default function FinancePayments({ selectedClass }: FinancePaymentsProps) {
  const [selectedYear, setSelectedYear] = useState(schoolYears[1]);
  const [schoolId, setSchoolId] = useState<string>("");
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    year: selectedYear,
    class: selectedClass,
    annualAmount: 0,
    quarterlyAmount: 0,
    monthlyAmount: 0,
    currency: "CDF",
    enrollmentFee: 0,
    latePaymentFee: 0,
    paymentDeadlines: [...defaultDeadlines],
    schoolId: "",
  });

  // Récupère schoolId avec useCallback pour mémoïser la fonction
  const fetchSchoolId = useCallback(async () => {
    try {
      let id = auth.currentUser?.uid || "";
      const uRef = doc(firestore, "users", id);
      const uSnap = await getDoc(uRef);
      if (uSnap.exists()) {
        const data = uSnap.data() as { schoolId?: string };
        if (data.schoolId) id = data.schoolId;
      }
      setSchoolId(id);
    } catch (e) {
      console.error("Erreur récupération schoolId:", e);
      setError("Impossible de récupérer l'identifiant d'école.");
    }
  }, []);

  // Récupère ou initialise les settings avec useCallback
  const fetchSettings = useCallback(async () => {
    if (!schoolId) return;
    
    setLoadingSettings(true);
    setError(null);

    try {
      const ref = collection(firestore, "schools", schoolId, "payements");
      const q = query(
        ref,
        where("class", "==", selectedClass),
        where("year", "==", selectedYear)
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const docData = snap.docs[0].data() as PaymentSettings;
        setPaymentSettings({
          ...docData,
          schoolId,
          class: selectedClass,
          year: selectedYear,
          paymentDeadlines: docData.paymentDeadlines || [...defaultDeadlines],
        });
      } else {
        setPaymentSettings((prev) => ({
          ...prev,
          year: selectedYear,
          class: selectedClass,
          schoolId,
          paymentDeadlines: [...defaultDeadlines],
        }));
      }
    } catch (e) {
      console.error("Erreur chargement paramètres:", e);
      setError("Impossible de charger les paramètres.");
    } finally {
      setLoadingSettings(false);
    }
  }, [schoolId, selectedClass, selectedYear]);

  // Effets combinés pour réduire les rendus
  useEffect(() => {
    fetchSchoolId();
  }, [fetchSchoolId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Calculs dérivés avec useCallback
  const calculateAmounts = useCallback((name: string, value: number) => {
    setPaymentSettings((prev) => {
      const newSettings = { ...prev };
      if (name === "annualAmount") {
        newSettings.annualAmount = value;
        newSettings.quarterlyAmount = parseFloat((value / 4).toFixed(2));
        newSettings.monthlyAmount = parseFloat((value / 12).toFixed(2));
      } else if (name === "quarterlyAmount") {
        newSettings.quarterlyAmount = value;
        newSettings.annualAmount = parseFloat((value * 4).toFixed(2));
        newSettings.monthlyAmount = parseFloat((value / 3).toFixed(2));
      } else if (name === "monthlyAmount") {
        newSettings.monthlyAmount = value;
        newSettings.annualAmount = parseFloat((value * 12).toFixed(2));
        newSettings.quarterlyAmount = parseFloat((value * 3).toFixed(2));
      }
      return newSettings;
    });
  }, []);

  // Handlers avec useCallback
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      
      if (name === "year") {
        setSelectedYear(value);
        return;
      }
      
      if (["annualAmount", "quarterlyAmount", "monthlyAmount"].includes(name)) {
        calculateAmounts(name, parseFloat(value) || 0);
      } else if (["enrollmentFee", "latePaymentFee"].includes(name)) {
        setPaymentSettings((prev) => ({
          ...prev,
          [name]: parseFloat(value) || 0,
        }));
      } else {
        setPaymentSettings((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    },
    [calculateAmounts]
  );

  const handleDeadlineChange = useCallback((idx: number, val: string) => {
    setPaymentSettings((prev) => {
      const deadlines = [...prev.paymentDeadlines];
      deadlines[idx] = val;
      return { ...prev, paymentDeadlines: deadlines };
    });
  }, []);

  // Sauvegarde upsert avec useCallback
  const saveSettings = useCallback(async () => {
    if (!schoolId) {
      setError("Identifiant d'école introuvable.");
      return;
    }
    
    setSaving(true);
    setError(null);

    try {
      const ref = collection(firestore, "schools", schoolId, "payements");
      const q = query(
        ref,
        where("class", "==", selectedClass),
        where("year", "==", selectedYear)
      );
      const snap = await getDocs(q);

      const settingsToSave = {
        ...paymentSettings,
        createdAt: serverTimestamp(),
      };

      if (!snap.empty) {
        // update existing
        const docRef = snap.docs[0].ref;
        await updateDoc(docRef, settingsToSave);
      } else {
        // create new
        await addDoc(ref, settingsToSave);
      }

      alert("Paramètres enregistrés avec succès !");
    } catch (e) {
      console.error("Erreur sauvegarde:", e);
      setError("Impossible d'enregistrer, veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  }, [schoolId, selectedClass, selectedYear, paymentSettings]);

  if (loadingSettings) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-64 bg-gray-300 rounded mb-4"></div>
            <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold">
            Paramètres financiers – {selectedClass}
          </h2>
          <select
            name="year"
            value={selectedYear}
            onChange={handleInputChange}
            className="border rounded-md px-3 py-2 w-full sm:w-auto"
          >
            {schoolYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Montants */}
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <h3 className="font-semibold text-lg mb-3 text-blue-800">
                Frais scolaires
              </h3>
              {[
                { label: "Frais d'inscription", name: "enrollmentFee" },
                { label: "Montant annuel", name: "annualAmount" },
                { label: "Montant trimestriel", name: "quarterlyAmount" },
                { label: "Montant mensuel", name: "monthlyAmount" },
              ].map(({ label, name }) => (
                <div key={name} className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    {label}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name={name}
                      value={(paymentSettings as any)[name] || 0}
                      onChange={handleInputChange}
                      min={0}
                      step={0.01}
                      className="w-full border rounded-md p-2 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                      {paymentSettings.currency}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Avancé */}
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100">
              <h3 className="font-semibold text-lg mb-3 text-yellow-800">
                Paramètres avancés
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Pénalité de retard (par mois)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="latePaymentFee"
                    value={paymentSettings.latePaymentFee || 0}
                    onChange={handleInputChange}
                    min={0}
                    step={0.01}
                    className="w-full border rounded-md p-2 pr-12 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                    {paymentSettings.currency}
                  </span>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Devise</label>
                <select
                  name="currency"
                  value={paymentSettings.currency}
                  onChange={handleInputChange}
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                >
                  {currencies.map((cur) => (
                    <option key={cur.code} value={cur.code}>
                      {cur.code} ({cur.label})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dates limites & récap */}
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-md border border-green-100">
              <h3 className="font-semibold text-lg mb-3 text-green-800">
                Dates limites de paiement
              </h3>
              {paymentSettings.paymentDeadlines.map((dl, i) => (
                <div key={i} className="mb-3">
                  <label className="block text-sm font-medium mb-1">
                    Trimestre {i + 1}
                  </label>
                  <input
                    type="text"
                    value={dl}
                    onChange={(e) => handleDeadlineChange(i, e.target.value)}
                    placeholder="JJ/MM"
                    pattern="\d{2}/\d{2}"
                    title="Format JJ/MM (ex: 15/09)"
                    className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="font-semibold text-lg mb-3">Récapitulatif</h3>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium">Année scolaire:</span>
                  <span>{paymentSettings.year}</span>
                  
                  <span className="font-medium">Frais d'inscription:</span>
                  <span>{paymentSettings.enrollmentFee} {paymentSettings.currency}</span>
                  
                  <span className="font-medium">Scolarité annuelle:</span>
                  <span>{paymentSettings.annualAmount} {paymentSettings.currency}</span>
                  
                  <span className="font-medium">Par trimestre:</span>
                  <span>{paymentSettings.quarterlyAmount} {paymentSettings.currency}</span>
                  
                  <span className="font-medium">Par mois:</span>
                  <span>{paymentSettings.monthlyAmount} {paymentSettings.currency}</span>
                  
                  <span className="font-medium">Pénalité de retard:</span>
                  <span>{paymentSettings.latePaymentFee} {paymentSettings.currency}/mois</span>
                </div>

                <div className="mt-4">
                  <p className="font-medium mb-2">Dates limites:</p>
                  <ul className="grid grid-cols-2 gap-2">
                    {paymentSettings.paymentDeadlines.map((dl, i) => (
                      <li key={i} className="flex items-center">
                        <span className="inline-block w-6 text-gray-500">
                          {i + 1}.
                        </span>
                        {dl}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md border border-red-100">
            {error}
          </div>
        )}
        
        <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={() => window.location.reload()}
            disabled={saving}
            className="px-6 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            {saving ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enregistrement...
              </span>
            ) : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}