"use client";

import React from "react";
import { Payment } from "./finance";


interface PaymentHistoryProps {
  payments: Payment[];
}

const formatDate = (date: Date) =>
  date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ payments }) => {
  return (
    <div className="border rounded-lg overflow-hidden mb-6">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {["Date", "Montant", "Méthode", "Référence"].map((th) => (
              <th
                key={th}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                {th}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {payments.length > 0 ? (
            payments.map((p) => (
              <tr key={p.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(p.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {p.amount.toLocaleString("fr-FR")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {p.method}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {p.reference}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={4}
                className="px-6 py-4 text-center text-sm text-gray-500"
              >
                Aucun paiement enregistré
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentHistory;