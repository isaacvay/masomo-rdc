"use client"; // Indique que ce composant est un Client Component
import React, { useState, useEffect } from "react";
import Image from "next/image"; // Pour le mockup 3D

function Hero() {
  const [isQrCodeChecked, setIsQrCodeChecked] = useState(false);

  // Effet pour changer automatiquement l'icône après 3 secondes
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsQrCodeChecked(true);
    }, 3000); // 3 secondes
    return () => clearTimeout(timeout); // Nettoyer le timeout lors du démontage
  }, []);

  return (
    <section className="relative h-screen bg-white text-gray-800 overflow-hidden pt-20">
      {/* Conteneur principal */}
      <div className="container w-[80%] mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Colonne gauche : Texte et CTA */}
        <div className="space-y-6">
          {/* Titre */}
          <h1 className="text-5xl sm:text-7xl font-bold text-[#0D1B2A] leading-tight animate-fade-in relative">
            L'Éducation{" "}
            <span className="relative inline-block">
              <span
                className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
                style={{ display: "inline-block" }}
              >
                Numérique
              </span>
              {/* Ligne calligraphique SVG */}
              <svg
                aria-hidden="true"
                viewBox="0 0 418 42"
                className="absolute top-full left-0 h-[0.58em] w-full fill-cyan-300/70 z-0"
                preserveAspectRatio="none"
              >
                <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z"></path>
              </svg>
            </span>{" "}
            <span className="relative z-10">Protégée</span>
          </h1>
          {/* Sous-titre */}
          <p className="text-xl sm:text-2xl text-gray-600 animate-fade-in">
            Gestion scolaire sécurisée et bulletins infalsifiables
          </p>
          {/* Boutons CTA */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-6">
            <button onClick={
              () => {
                window.location.href = "/pages/connexion";
              }
            } className="px-8 py-4 bg-cyan-200 text-[#0D1B2A] font-semibold rounded-full shadow-md hover:shadow-lg transition duration-300 transform hover:scale-105">
              Commencer
            </button>
            <button onClick={
              () => {
                window.location.href = "/pages/verification-bulletin";
              }
            } className="px-8 py-4 bg-white border-2 border-[#0D1B2A] text-[#0D1B2A] font-semibold rounded-full shadow-md hover:shadow-lg transition duration-300 transform hover:scale-105">
              Verifier le bulletin
            </button>
          </div>
        </div>
        {/* Colonne droite : Mockup 3D */}
        <div className="grid grid-cols-2 gap-4">
          {/* Bloc 1 : Graphique */}
          <div className="relative w-full h-64 rounded-2xl overflow-hidden shadow-lg bg-cyan-200 flex items-center justify-center">
            {/* Conteneur pour réduire la taille de l'image */}
            <div className="relative w-60 h-60">
              <Image
                src="/images/bulletin.png" // Remplacez par votre image d'avatar
                alt="Bulletin"
                layout="fill"
                objectFit="contain"
                className="rounded-2xl transition duration-300 transform hover:scale-105"
              />
              {/* Superposition de l'icône */}
              <div className="absolute inset-0 flex items-center justify-center">
                {isQrCodeChecked ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-20 h-20 text-green-500 animate-bounce"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-12 h-12 text-gray-700"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-4.08 3.05-7.44 7-7.93v15.86zm2 0v-15.86c3.95.49 7 3.85 7 7.93 0 4.08-3.05 7.44-7 7.93z" />
                  </svg>
                )}
              </div>
            </div>
          </div>
          {/* Bloc 2 : QR Code animé */}
          <div className="relative w-full h-64 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center">
            <div className="w-64 h-64 bg-[#0D1B2A] rounded-full animate-pulse">
              <Image
                src="/images/qrimage.jpg" // Remplacez par votre image de mockup
                alt="QR Code"
                layout="fill"
                objectFit="cover"
                className="rounded-2xl transition duration-300 transform hover:scale-105"
              />
            </div>
          </div>
          {/* Bloc 3 : Avatar stylisé */}
          <div className="relative w-full h-64 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-[#43B7E9] to-[#87C6B9] flex items-center justify-center">
            <Image
              src="/images/eleveh.jpg" // Remplacez par votre image d'avatar
              alt="Avatar d'élève africain stylisé"
              layout="fill"
              objectFit="cover"
              className="rounded-2xl transition duration-300 transform hover:scale-105"
            />
          </div>
          {/* Bloc 4 : Mockup d'interface */}
          <div className="relative w-full h-64 rounded-2xl bg-red-200 overflow-hidden shadow-lg">
            <div className="w-20 h-32">
              <Image
                src="/images/rdc.png" // Remplacez par votre image de mockup
                alt="Mockup d'interface Masomo"
                layout="fill"
                objectFit="contain"
                className="rounded-2xl transition duration-300 transform hover:scale-105"
              />
            </div>
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
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
  .animate-pulse {
    animation: pulse 2s infinite ease-in-out;
  }
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  .animate-bounce {
    animation: bounce 1s infinite ease-in-out;
  }
`;

export default function HeroWithStyles() {
  return (
    <>
      <style>{styles}</style>
      <Hero />
    </>
  );
}