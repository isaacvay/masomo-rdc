"use client";
import React, { useState } from "react";
import { FaPrint, FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";

interface Student {
  id: string;
  displayName: string;
  section: string;
  classe: string;
  email: string;
  password: string;
}

interface ListeEleveMPProps {
  displayName: string;
  section: string;
  classe: string;
  email: string;
  password: string;
  onRetour: () => void;
  eleves: Student[];
  loading: boolean;
  error: string | null;
}

export default function ListeEleveMP({
  eleves,
  onRetour,
  loading,
  error,
  classe,
  section,
}: ListeEleveMPProps) {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (studentId: string) => {
    setShowPasswords((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handlePrint = () => {
    const printContent = document.getElementById("printable-area");
    if (!printContent) return;

    // Ouvrir une nouvelle fenêtre pour l'impression
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Cloner le contenu à imprimer
    const clone = printContent.cloneNode(true) as HTMLElement;

    // Pour l'impression, afficher les mots de passe en clair
    const passwordSpans = clone.querySelectorAll("[data-password]");
    passwordSpans.forEach((span) => {
      const password = span.getAttribute("data-password");
      if (password) span.textContent = password;
    });

    // Supprimer les boutons inutiles dans l'impression
    const buttons = clone.querySelectorAll("button");
    buttons.forEach((btn) => btn.remove());

    // Ecrire le contenu dans la nouvelle fenêtre
    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Impression</title>
          <style>
            /* Vous pouvez copier ici vos styles ou lier vos fichiers CSS */
            body {
              font-family: sans-serif;
              padding: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 8px;
              text-align: left;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>${clone.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500 animate-pulse">
        Chargement en cours...
      </div>
    );
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
          aria-label="Retour à la page précédente"
        >
          <FaArrowLeft className="shrink-0" />
          <span>Retour</span>
        </button>
        <button
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          onClick={handlePrint}
          aria-label="Imprimer la liste"
        >
          <FaPrint className="shrink-0" />
          <span>Imprimer</span>
        </button>
      </div>

      {/* En-tête */}
      <div className="mb-8 space-y-2 print:mb-4">
        <h2 className="text-3xl font-bold text-gray-800 text-center print:text-2xl">
          Liste des élèves
        </h2>
        <div className="pl-5 space-y-1">
          <p className="text-xl text-gray-800 print:text-lg">
            Section : <span className="font-semibold">{eleves[0].section}</span>
          </p>
          <p className="text-xl text-gray-800 print:text-lg">
            Classe : <span className="font-semibold">{classe}</span>
          </p>
        </div>
      </div>

      {/* Tableau */}
      {eleves.length === 0 ? (
        <div className="text-center text-gray-500 bg-gray-50 p-8 rounded-xl">
          Aucun élève trouvé
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
              {eleves.map((eleve) => (
                <tr
                  key={eleve.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 text-gray-900 font-medium print:px-4 print:py-3">
                    {eleve.displayName}
                  </td>
                  <td className="px-6 py-4 text-gray-600 print:px-4 print:py-3">
                    {eleve.email}
                  </td>
                  <td className="px-6 py-4 print:px-4 print:py-3">
                    {eleve.password ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="font-mono"
                          data-password={eleve.password}
                        >
                          {showPasswords[eleve.id]
                            ? eleve.password
                            : "••••••••"}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(eleve.id)}
                          className="text-gray-500 hover:text-gray-700 transition-colors duration-200 focus:outline-none"
                          aria-label={
                            showPasswords[eleve.id]
                              ? "Cacher le mot de passe"
                              : "Afficher le mot de passe"
                          }
                        >
                          {showPasswords[eleve.id] ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
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
