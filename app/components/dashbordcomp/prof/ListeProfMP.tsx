"use client";
import React, { useState } from "react";
import { FaEye, FaEyeSlash, FaPrint, FaArrowLeft } from "react-icons/fa";

interface Prof {
  id: string;
  displayName: string;
  email?: string;
  password?: string;
}

interface ListeProfMPProps {
  profs: Prof[];
  onRetour: () => void;
  loading?: boolean;
  error?: string;
}

export default function ListeProfMP({ profs, onRetour, loading, error }: ListeProfMPProps) {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (profId: string) => {
    setShowPasswords(prev => ({ ...prev, [profId]: !prev[profId] }));
  };

  const handlePrint = () => {
    const originalContents = document.body.innerHTML;
    const printContent = document.getElementById("printable-area")?.outerHTML;
    if (printContent) {
      document.body.innerHTML = printContent;
      window.print();
      document.body.innerHTML = originalContents;
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500 animate-pulse">Chargement en cours...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-red-500 font-medium bg-red-50 p-4 rounded-lg border border-red-100">
          Erreur : {error}
        </p>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
          onClick={onRetour}
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 print:p-12" id="printable-area">
      {/* Contrôles */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8 print:hidden">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          onClick={onRetour}
        >
          <FaArrowLeft className="shrink-0" />
          <span>Retour</span>
        </button>
        <button
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          onClick={handlePrint}
        >
          <FaPrint className="shrink-0" />
          <span>Imprimer</span>
        </button>
      </div>

      {/* Titre */}
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center print:text-2xl print:mb-4">
        Liste des professeurs
      </h2>

      {/* Tableau */}
      {profs.length === 0 ? (
        <div className="text-center text-gray-500 bg-gray-50 p-8 rounded-xl">
          Aucun professeur trouvé
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm print:shadow-none print:border-2">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 print:bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 print:px-4 print:py-3">
                  Nom
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 print:px-4 print:py-3">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 print:px-4 print:py-3">
                  Mot de passe
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {profs.map((prof) => (
                <tr key={prof.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 text-gray-900 font-medium print:px-4 print:py-3">
                    {prof.displayName}
                  </td>
                  <td className="px-6 py-4 text-gray-600 print:px-4 print:py-3">
                    {prof.email || <span className="text-gray-400">N/A</span>}
                  </td>
                  <td className="px-6 py-4 print:px-4 print:py-3">
                    <div className="flex items-center gap-2">
                      {prof.password || (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}