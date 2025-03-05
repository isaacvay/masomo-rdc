"use client"; // Indique que ce composant est un Client Component
import React, { useState } from "react";

function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null);

  // Données des questions et réponses
  const faqs = [
    {
      question: "Qu'est-ce que MASOMO RDC ?",
      answer:
        "MASOMO RDC est une plateforme numérique sécurisée conçue pour la gestion scolaire. Elle permet de générer des bulletins infalsifiables et offre des fonctionnalités avancées pour les établissements éducatifs.",
    },
    {
      question: "Comment puis-je créer un compte ?",
      answer:
        "Pour créer un compte, cliquez sur 'Connexion' dans la barre de navigation, puis sélectionnez 'Inscription'. Remplissez le formulaire avec vos informations et suivez les instructions.",
    },
    {
      question: "Est-ce que MASOMO RDC est gratuit ?",
      answer:
      "MASOMO RDC n'est pas gratuit. Un abonnement est requis pour accéder à toutes les fonctionnalités." 
     },
    {
      question: "Comment fonctionne la sécurité des bulletins ?",
      answer:
        "Les bulletins générés par MASOMO RDC sont protégés par des QR codes uniques et cryptés. Cela garantit leur authenticité et empêche toute falsification.",
    },
    {
      question: "Puis-je utiliser MASOMO RDC sur mobile ?",
      answer:
        "Oui, MASOMO RDC est entièrement compatible avec les appareils mobiles. Vous pouvez accéder à la plateforme via un navigateur ou télécharger notre application (si disponible).",
    },
    {
      question: "Quels sont les modes de paiement acceptés ?",
      answer:
        "Nous acceptons les cartes de crédit, M-Pesa et les virements bancaires. Tous les paiements sont sécurisés et conformes aux normes internationales.",
    },
    {
      question: "Comment contacter le support technique ?", 
      answer:
        "Vous pouvez nous contacter via la page 'Contact' ou envoyer un e-mail à support@masomo.com. Notre équipe est disponible pour répondre à vos questions.",
    },
  ];

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4 w-[80%]">
        <h2 className="text-3xl font-bold text-center text-[#0D1B2A] mb-8">
        Les questions fréquemment posées (FAQ)
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-md transition duration-300 hover:shadow-lg"
            >
              {/* Question */}
              <button
                onClick={() => setActiveIndex(activeIndex === index ? null : index as unknown as null)}                className="flex justify-between items-center w-full text-left focus:outline-none"
              >
                <h3 className="text-lg font-semibold text-[#0D1B2A]">{faq.question}</h3>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-5 h-5 transition-transform ${
                    activeIndex === index ? "transform rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* Réponse */}
              {activeIndex === index && (
                <p className="mt-4 text-gray-700">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;
