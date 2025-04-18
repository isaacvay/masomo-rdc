"use client";

import React, { useState } from "react";
import { auth, firestore } from "@/config/firebase";
import { doc, updateDoc, collection, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { Check, X } from "lucide-react";
import { Payment, Student } from "./finance";


interface PaymentFormProps {
  student: Student;
  schoolId: string;
  classe: string;
  onSuccess: (newPayment: Payment) => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  student,
  schoolId,
  classe,
  onSuccess,
  onCancel
}) => {
  const [paymentData, setPaymentData] = useState({
    amount: "",
    method: "Espèces",
    date: new Date().toISOString().split("T")[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!auth.currentUser) throw new Error("Non authentifié");

      const timestamp = Date.now().toString();
      const autoReference = "Ref" + timestamp.slice(-6);

      const payementsRef = collection(
        firestore,
        "schools",
        schoolId,
        "payements"
      );
      const newDocRef = doc(payementsRef);
      await setDoc(newDocRef, {
        date: Timestamp.fromDate(new Date(paymentData.date)),
        amount: Number(paymentData.amount),
        method: paymentData.method,
        reference: autoReference,
        recordedBy: auth.currentUser.uid,
        studentId: student.id,
        classe,
        schoolId,
        paymentId: newDocRef.id,
        createdAt: serverTimestamp(),
      });

      const newPayment: Payment = {
        id: newDocRef.id,
        date: new Date(paymentData.date),
        amount: Number(paymentData.amount),
        method: paymentData.method,
        reference: autoReference,
        recordedBy: auth.currentUser.uid,
      };

      onSuccess(newPayment);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Nouveau paiement</h3>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Montant</label>
          <input
            type="number"
            name="amount"
            value={paymentData.amount}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
            min={1}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            name="date"
            value={paymentData.date}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Méthode de paiement</label>
          <select
            name="method"
            value={paymentData.method}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          >
            {[
              "Espèces",
              "Mobile Money",
              "Virement bancaire",
              "Chèque",
              "Carte bancaire",
            ].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          disabled={isSubmitting}
        >
          <X size={18} /> Annuler
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>Enregistrement…</>
          ) : (
            <>
              <Check size={18} /> Enregistrer
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;