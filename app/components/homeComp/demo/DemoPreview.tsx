import React from "react";

function DemoPreview() {
  return (
    <section className="relative py-20 bg-gradient-to-br from-[#E3F2FD] to-[#F4F4F4] overflow-hidden">
      {/* Effet lumineux en arrière-plan */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-12 w-52 h-52 bg-[#43B7E9] opacity-30 blur-[90px] rounded-full"></div>
        <div className="absolute top-1/2 right-0 w-40 h-40 bg-[#50C878] opacity-30 blur-[90px] rounded-full"></div>
        <div className="absolute bottom-14 left-1/4 w-36 h-36 bg-[#FFB4B4] opacity-30 blur-[90px] rounded-full"></div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-6 relative z-10 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-[#0D1B2A] leading-tight drop-shadow-md">
          Découvrez notre plateforme en un coup d'œil
        </h2>
        <p className="mt-4 text-lg text-gray-700">
          Une interface moderne et intuitive conçue pour une expérience optimale.
        </p>

        {/* Image de démonstration avec effet lumineux */}
        <div className="mt-12 relative w-full max-w-3xl mx-auto shadow-2xl rounded-3xl overflow-hidden hover:scale-105 transition-transform duration-500">
          <div className="absolute inset-0 bg-white bg-opacity-10  rounded-3xl"></div>
          <img
            src="/images/muck.png" // Remplacez par votre image
            alt="Mockup de la plateforme"
            className="w-full h-auto rounded-3xl"
          />
        </div>

        {/* Points forts en 3 colonnes avec effet glassmorphism */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { text: "Interface fluide", icon: "⚡" },
            { text: "Expérience immersive", icon: "🎨" },
            { text: "100% responsive", icon: "📱" },
          ].map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center bg-white bg-opacity-20 backdrop-blur-xl shadow-lg rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition duration-300"
            >
              <span className="text-4xl drop-shadow-lg">{feature.icon}</span>
              <p className="mt-3 text-lg text-gray-800 font-medium">{feature.text}</p>
            </div>
          ))}
        </div>

        {/* Bouton d’action avec hover dynamique */}
        <div className="mt-10">
          <a
            href="#"
            className="px-6 py-3 text-lg font-semibold text-white bg-[#43B7E9] rounded-full shadow-lg hover:bg-[#3aa3d5] hover:scale-105 transition-transform duration-300"
          >
            Tester la plateforme 🚀
          </a>
        </div>
      </div>
    </section>
  );
}

export default DemoPreview;
