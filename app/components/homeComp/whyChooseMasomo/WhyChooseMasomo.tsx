"use client"; // Indique que ce composant est un Client Component

import React, { useState, useEffect, useMemo, memo } from "react";
import Image from "next/image";

function WhyChooseMasomo() {
  const features = useMemo(() => [
    {
      icon: "🔒",
      title: "Sécurité Garantie",
      description:
        "Nous utilisons des protocoles de sécurité avancés pour protéger vos données.",
      bgColor: "bg-[#BEFFB4FF]", // Vert doux
    },
    {
      icon: "⚡",
      title: "Rapidité et Performance",
      description:
        "Notre plateforme est optimisée pour offrir une expérience fluide et rapide.",
      bgColor: "bg-[#D3A8DCFF]", // Bleu-vert doux
    },
    {
      icon: "📚",
      title: "Interface Simple et Intuitive",
      description:
        "Une interface conviviale conçue pour simplifier la gestion des notes.",
      bgColor: "bg-[#F4D35E]", // Jaune doré
    },
    {
      icon: "🌐",
      title: "Accessibilité Partout",
      description:
        "Accédez à vos données depuis n'importe quel appareil, où que vous soyez.",
      bgColor: "bg-[#B1B1B1FF]", // Gris clair
    },
  ], []);

  const [currentImage, setCurrentImage] = useState("/images/eleve.jpg");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prevImage) =>
        prevImage === "/images/eleve.jpg" ? "/images/eleve2.jpg" : "/images/eleve.jpg"
      );
    }, 5000); // Change toutes les 5 secondes

    return () => clearInterval(interval); // Nettoyer l'intervalle lors du démontage
  }, []);

  return (
    <section className="py-20 bg-[#F9FAFB]">
      {/* Conteneur Global */}
      <div className="container mx-auto px-4 max-w-screen-xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-11 items-center">
          {/* Colonne Gauche : Texte et Avantages */}
          <div>
            <h2 className="text-4xl font-bold text-[#1E293B] mb-6 animate-fade-in">
              Pourquoi choisir Masomo RDC ?
            </h2>
            <p className="text-gray-600 text-lg mb-6 animate-fade-in">
              Masomo RDC est la plateforme qui permet de gérer efficacement les écoles, enseignants et élèves, tout en garantissant l'authenticité des documents scolaires. Chaque bulletin généré contient un QR code unique permettant de vérifier son intégrité.
              Grâce à notre solution, les écoles peuvent enregistrer les notes des élèves et générer des bulletins automatiquement, au format PDF ou HTML. Nous apportons une solution fiable contre les falsifications et la fraude scolaire.
            </p>
            {/* Liste des Avantages */}
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg p-6 transition-transform duration-300 hover:scale-105 hover:shadow-xl"
                >
                  <div
                    className={`flex items-center justify-center w-16 h-16 rounded-full ${feature.bgColor} text-white text-2xl mb-4 shadow-md`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-[#1E293B] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Colonne Droite : Image Animée avec Transition */}
          <div className="relative min-h-[400px] lg:min-h-[500px] overflow-hidden rounded-3xl shadow-2xl">
            {/* Image avec transition d'opacité */}
            <div
              className={`absolute inset-0 transition-opacity duration-1000 ${
                currentImage === "/images/eleve.jpg" ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src="/images/eleve.jpg"
                alt="Élèves utilisant Masomo RDC"
                layout="fill"
                objectFit="cover"
                className="rounded-3xl"
              />
            </div>
            <div
              className={`absolute inset-0 transition-opacity duration-1000 ${
                currentImage === "/images/eleve2.jpg" ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src="/images/eleve2.jpg"
                alt="Élèves utilisant Masomo RDC"
                layout="fill"
                objectFit="cover"
                className="rounded-3xl"
              />
            </div>
            {/* Effet de Flou Subtil */}
            <div className="absolute inset-0 bg-black/10 rounded-3xl"></div>
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

const WhyChooseMasomoWithStyles = () => (
  <>
    <style>{styles}</style>
    <WhyChooseMasomo />
  </>
);

export default memo(WhyChooseMasomoWithStyles);
