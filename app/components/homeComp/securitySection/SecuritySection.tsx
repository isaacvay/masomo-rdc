"use client"; // Indique que ce composant est un Client Component

import React from "react";
import Image from "next/image"; // Pour afficher le GIF

function SecuritySection() {
  return (
    <section className="py-20 bg-[#F4F4F4] relative overflow-hidden">
      {/* Motif de circuit imprimé africain stylisé */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          fill="currentColor"
        >
          <path
            d="M0,160L48,170.7C96,181,192,203,288,192C384,181,480,139,576,138.7C672,139,768,181,864,186.7C960,192,1056,160,1152,160C1248,160,1344,192,1392,208L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill="#43B7E9"
          />
        </svg>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-4xl sm:text-5xl font-bold text-center text-[#0D1B2A] mb-12 animate-fade-in">
          Technologie Anti-Fraude
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Colonne gauche : GIF Animé */}
          <div className="relative w-full h-[400px] flex items-center justify-center">
            <Image
              src="/images/qrfo.gif" // Chemin vers votre GIF
              alt="Animation QR Code -> Document Check"
              width={300} // Largeur du GIF
              height={300} // Hauteur du GIF
              className="rounded-lg shadow-lg"
            />
          </div>

          {/* Colonne droite : Liste des fonctionnalités */}
          <div>
            <h3 className="text-3xl font-semibold text-[#0D1B2A] mb-6">
              Technologie Anti-Fraude
            </h3>
            <ul className="space-y-4 text-gray-600">
              <li className="flex items-start space-x-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-[#43B7E9]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Signature numérique pour sécuriser les documents.</span>
              </li>
              <li className="flex items-start space-x-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-[#43B7E9]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Vérification instantanée via QR code.</span>
              </li>
              <li className="flex items-start space-x-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-[#43B7E9]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Archivage local et cloud sécurisé.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// Animations personnalisées avec CSS pur
const styles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-in {
    animation: fadeIn 1s ease-in-out;
  }
`;

export default function SecuritySectionWithStyles() {
  return (
    <>
      <style>{styles}</style>
      <SecuritySection />
    </>
  );
}