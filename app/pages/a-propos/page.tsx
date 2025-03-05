"use client";
import React from 'react';
import Footer from '@/app/components/footer/Footer';

const AboutPage = () => {
  
  return (
    <div className="font-sans bg-gradient-to-r mt-20 from-blue-600 to-teal-500 text-white">

      {/* En-tête */}
      <header className="py-20 px-6 md:px-12 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-teal-100">
          Masomo RDC
        </h1>
        <p className="mt-4 text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
          La solution numérique qui révolutionne l’enregistrement des élèves et la génération de bulletins sécurisés en République Démocratique du Congo.
        </p>
      </header>

      {/* Description du projet */}
      <section className="relative py-20 px-6 md:px-12 bg-gray-900 bg-opacity-80 rounded-xl shadow-lg backdrop-blur-lg mt-12">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-teal-200 mb-8">À propos de Masomo RDC</h2>
          <div className="md:flex md:justify-between items-center">
            <div className="md:w-1/2 text-lg text-gray-300 leading-relaxed">
              <p>
                Masomo RDC est la plateforme qui permet de gérer efficacement les écoles, enseignants et élèves, tout en garantissant l'authenticité des documents scolaires. Chaque bulletin généré contient un QR code unique permettant de vérifier son intégrité.
              </p>
              <p className="mt-6">
                Grâce à notre solution, les écoles peuvent enregistrer les notes des élèves et générer des bulletins automatiquement, au format PDF ou HTML. Nous apportons une solution fiable contre les falsifications et la fraude scolaire.
              </p>
            </div>
            <div className="mt-8 ml-14 md:mt-0 md:w-1/2">
              <img src="/images/logop.png" alt="Logo de Masomo RDC" className="w-full h-auto rounded-xl shadow-lg object-cover transform hover:scale-105 transition duration-300" />
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section className="py-20 px-6 md:px-12 bg-gradient-to-r from-teal-300 to-blue-400">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900">Fonctionnalités clés</h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-xl shadow-xl transform hover:scale-105 transition duration-300">
              <h3 className="text-xl font-semibold text-teal-500">Création et gestion des écoles</h3>
              <p className="mt-4 text-gray-700">Créez et gérez facilement vos établissements, enseignants et élèves avec une interface simple et intuitive.</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-xl transform hover:scale-105 transition duration-300">
              <h3 className="text-xl font-semibold text-teal-500">Saisie des notes et génération des bulletins</h3>
              <p className="mt-4 text-gray-700">Enregistrez les résultats des élèves et générez des bulletins au format PDF ou HTML automatiquement.</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-xl transform hover:scale-105 transition duration-300">
              <h3 className="text-xl font-semibold text-teal-500">Sécurisation des documents avec QR code</h3>
              <p className="mt-4 text-gray-700">Chaque bulletin est sécurisé avec un QR code unique permettant de vérifier son authenticité en ligne.</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-xl transform hover:scale-105 transition duration-300">
              <h3 className="text-xl font-semibold text-teal-500">Moteur de recherche pour validation des bulletins</h3>
              <p className="mt-4 text-gray-700">Utilisez notre moteur de recherche pour valider facilement un bulletin scolaire grâce au QR code.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistiques et impact */}
      <section className="py-20 px-6 md:px-12 bg-gray-800 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-semibold text-teal-200 mb-6">Notre impact</h2>
          <p className="text-xl text-gray-300 opacity-80 mb-12">Masomo RDC est déjà utilisé par de nombreuses écoles pour garantir l'intégrité des documents scolaires en RDC.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="bg-teal-500 p-6 rounded-xl shadow-lg text-white">
              <p className="text-3xl font-bold">1000+</p>
              <p className="text-lg">Écoles inscrites</p>
            </div>
            <div className="bg-teal-500 p-6 rounded-xl shadow-lg text-white">
              <p className="text-3xl font-bold">5000+</p>
              <p className="text-lg">Bulletins vérifiés</p>
            </div>
            <div className="bg-teal-500 p-6 rounded-xl shadow-lg text-white">
              <p className="text-3xl font-bold">200+</p>
              <p className="text-lg">Enseignants inscrits</p>
            </div>
            <div className="bg-teal-500 p-6 rounded-xl shadow-lg text-white">
              <p className="text-3xl font-bold">95%</p>
              <p className="text-lg">Taux de satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Appel à l'action */}
      <section className="py-20 px-6 md:px-12 text-center bg-gradient-to-r from-teal-500 to-blue-600 text-white">
        <h3 className="text-3xl font-semibold">Rejoignez Masomo RDC</h3>
        <p className="mt-4 text-xl max-w-2xl mx-auto opacity-90">
          Commencez à sécuriser vos documents scolaires dès aujourd'hui et faites partie de la solution !
        </p>
        <button 
          onClick={() => window.location.href = "/pages/inscription"} 
          className="mt-8 bg-teal-700 hover:bg-teal-600 text-white py-3 px-8 rounded-lg text-xl transition duration-300 transform hover:scale-105"
        >
          Inscrire mon école
        </button>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AboutPage;
