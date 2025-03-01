"use client"; // Indique que ce composant est un Client Component

import React from "react";

function FeaturesGrid() {
  return (
    <section className="py-20 bg-[#F4F4F4] relative overflow-hidden">
      {/* Motifs géométriques subtils */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          fill="currentColor"
        >
          <path d="M0,160L48,170.7C96,181,192,203,288,192C384,181,480,139,576,138.7C672,139,768,181,864,186.7C960,192,1056,160,1152,160C1248,160,1344,192,1392,208L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" fill="#43B7E9" />
        </svg>
        <svg
          className="w-full h-full rotate-180"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          fill="currentColor"
        >
          <path d="M0,160L48,170.7C96,181,192,203,288,192C384,181,480,139,576,138.7C672,139,768,181,864,186.7C960,192,1056,160,1152,160C1248,160,1344,192,1392,208L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" fill="#FFB4B4" />
        </svg>
      </div>

      {/* Contenu principal */}
      <div className="mx-auto w-[90%] px-4 relative z-10">
        <h2 className="text-4xl sm:text-5xl font-bold text-center text-[#0D1B2A] mb-12 animate-fade-in">
          Fonctionnalités Principales
        </h2>

        {/* Grille de fonctionnalités */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Carte 1 : Création d'Écoles & Classes */}
          <div className="relative group bg-white rounded-2xl shadow-lg p-6 transition duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
            <div className="flex justify-center items-center w-16 h-16 bg-[#43B7E9] rounded-full mx-auto mb-4 group-hover:scale-110 transition duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m13 0h-2m2 0v-6m-2 6v-4m2 4v-2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-center text-[#0D1B2A] mb-2">Création d'Écoles & Classes</h3>
            <p className="text-gray-600 text-center">Configurez facilement des écoles et des classes personnalisées.</p>
          </div>

          {/* Carte 2 : Saisie Intelligente de Notes */}
          <div className="relative group bg-white rounded-2xl shadow-lg p-6 transition duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
            <div className="flex justify-center items-center w-16 h-16 bg-[#87C6B9] rounded-full mx-auto mb-4 group-hover:scale-110 transition duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-center text-[#0D1B2A] mb-2">Saisie Intelligente de Notes</h3>
            <p className="text-gray-600 text-center">Utilisez l'IA pour saisir et analyser les notes en quelques clics.</p>
          </div>

          {/* Carte 3 : Bulletins Cryptographiés */}
          <div className="relative group bg-white rounded-2xl shadow-lg p-6 transition duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
            <div className="flex justify-center items-center w-16 h-16 bg-[#FFB4B4] rounded-full mx-auto mb-4 group-hover:scale-110 transition duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-center text-[#0D1B2A] mb-2">Bulletins Cryptographiés</h3>
            <p className="text-gray-600 text-center">Générez des bulletins sécurisés avec des QR codes infalsifiables.</p>
          </div>

          {/* Carte 4 : Vérification Instantanée */}
          <div className="relative group bg-white rounded-2xl shadow-lg p-6 transition duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
            <div className="flex justify-center items-center w-16 h-16 bg-[#43B7E9] rounded-full mx-auto mb-4 group-hover:scale-110 transition duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-center text-[#0D1B2A] mb-2">Vérification Instantanée</h3>
            <p className="text-gray-600 text-center">Vérifiez l'authenticité des bulletins en temps réel.</p>
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

export default function FeaturesGridWithStyles() {
  return (
    <>
      <style>{styles}</style>
      <FeaturesGrid />
    </>
  );
}
