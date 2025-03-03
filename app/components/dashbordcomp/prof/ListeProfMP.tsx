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
    const printContent = document.getElementById("printable-area");
    if (!printContent) return;

    // Ouvrir une nouvelle fenêtre pour l'impression
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Cloner le contenu à imprimer
    const clone = printContent.cloneNode(true) as HTMLElement;

    // Pour l'impression, si besoin d'afficher en clair les mots de passe, vous pouvez vérifier 
    // s'il existe des éléments avec l'attribut data-password et remplacer leur contenu.
    const passwordSpans = clone.querySelectorAll("[data-password]");
    passwordSpans.forEach(span => {
      const password = span.getAttribute("data-password");
      if (password) span.textContent = password;
    });

    // Supprimer les boutons inutiles dans l'impression
    const buttons = clone.querySelectorAll("button");
    buttons.forEach(btn => btn.remove());

    // Ecrire le contenu dans la nouvelle fenêtre
    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Impression</title>
          <style>
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
                      {prof.password ? (
                        // Ajout d'un attribut data-password pour permettre l'affichage complet lors de l'impression
                        <span className="font-mono" data-password={prof.password}>
                          {showPasswords[prof.id] ? prof.password : "••••••••"}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                      {prof.password && (
                        <button
                          onClick={() => togglePasswordVisibility(prof.id)}
                          className="text-gray-500 hover:text-gray-700 transition-colors duration-200 focus:outline-none"
                          aria-label={showPasswords[prof.id] ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                        >
                          {showPasswords[prof.id] ? <FaEyeSlash /> : <FaEye />}
                        </button>
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
