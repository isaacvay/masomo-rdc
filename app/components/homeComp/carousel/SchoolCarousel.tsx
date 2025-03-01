"use client";
import React, { memo } from "react";
// @ts-ignore
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function SchoolCarousel() {
  const settings = {
    dots: true, // Afficher les points de navigation
    infinite: true, // Boucle infinie
    speed: 800, // Vitesse de transition
    slidesToShow: 3, // Nombre de slides visibles
    slidesToScroll: 1, // Nombre de slides à faire défiler
    autoplay: true, // Lecture automatique
    autoplaySpeed: 4000, // Vitesse de lecture automatique
    pauseOnHover: true, // Pause lors du survol
    arrows: false, // Masquer les flèches par défaut
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  const schools = [
    {
      name: "École A",
      image:
        "/images/ecole1.jpeg", // Image temporaire
      description: "Une école innovante axée sur la technologie.",
    },
    {
      name: "École B",
      image:
        "/images/ecole2.jpeg",
      description: "Un environnement d'apprentissage inclusif et moderne.",
    },
    {
      name: "École C",
      image:
        "/images/ecole3.jpeg",
      description: "Des programmes académiques de haute qualité.",
    },
    {
      name: "École D",
      image:
        "/images/ecole4.jpeg",
      description: "Une communauté éducative engagée et dynamique.",
    },
    {
      name: "École E",
      image:
        "/images/ecole5.jpeg",
      description: "Des installations modernes pour un apprentissage optimal.",
    },
  ];

  return (
    <section className="py-20 bg-[#F9FAFB]">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl sm:text-5xl font-bold text-center text-[#1E293B] mb-12 animate-fade-in">
          Nos Partenaires Éducatifs
        </h2>

        <Slider {...settings}>
          {schools.map((school, index) => (
            <div key={index} className="px-4 mt-4">
              <div className="group rounded-3xl overflow-hidden shadow-md bg-white transition-all duration-500 hover:shadow-lg hover:-translate-y-2 transform-gpu">
                {/* Image */}
                <img
                  src={school.image}
                  alt={school.name}
                  className="w-full h-64 object-cover group-hover:brightness-90 transition-all duration-500"
                  loading="lazy"  // Optimisation
                />
                {/* Contenu Textuel */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[#1E293B] mb-2 group-hover:text-[#A8DADC] transition-colors duration-300">
                    {school.name}
                  </h3>
                  <p className="text-gray-600 text-sm">{school.description}</p>
                </div>
              </div>
            </div>
          ))}
        </Slider>
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

export default memo(function SchoolCarouselWithStyles() {
  return (
    <>
      <style>{styles}</style>
      <SchoolCarousel />
    </>
  );
});