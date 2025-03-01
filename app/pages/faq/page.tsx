"use client";
import Footer from '@/app/components/footer/Footer'
import React, { useState } from 'react'
import { FiChevronDown, FiChevronUp, FiSearch } from 'react-icons/fi'

const faqData = [
  {
    category: "Fonctionnalités Principales",
    items: [
      {
        question: "Qu'est-ce que Masomo RDC ?",
        answer: "Masomo RDC est une plateforme complète de gestion scolaire sécurisée permettant aux établissements d'administrer élèves, enseignants et résultats académiques. Notre système inclut une certification numérique anti-fraude par QR code unique.",
        tags: ["plateforme", "présentation"]
      },
      {
        question: "Comment vérifier un bulletin scolaire ?",
        answer: "Utilisez l'application caméra de votre smartphone pour scanner le QR code unique. Vous serez redirigé vers notre portail de vérification qui confirmera instantanément l'authenticité du document.",
        tags: ["vérification", "QR code"]
      }
    ]
  },
  {
    category: "Gestion des Documents",
    items: [
      {
        question: "Formats de bulletins disponibles ?",
        answer: "Exportez les bulletins en PDF (haute résolution pour impression) ou HTML (consultation interactive en ligne), tous deux protégés par notre système de sécurité.",
        tags: ["formats", "export"]
      },
      {
        question: "Modification des notes après publication ?",
        answer: "Toute modification post-publication génère automatiquement une nouvelle version du bulletin avec historique des changements traçable dans le système.",
        tags: ["modification", "historique"]
      }
    ]
  },
  {
    category: "Sécurité & Confidentialité",
    items: [
      {
        question: "Protection des données élèves ?",
        answer: "Cryptage AES-256 des données sensibles, sauvegardes quotidiennes, et conformité RGPD. L'accès est restreint par rôles et permissions granulaires.",
        tags: ["sécurité", "données"]
      },
      {
        question: "Panneau de contrôle parental ?",
        answer: "Les parents reçoivent un accès sécurisé pour suivre les résultats et activités scolaires, avec système d'alertes en temps réel.",
        tags: ["parents", "accès"]
      }
    ]
  }
];

export default function FAQPage() {
  const [activeIndex, setActiveIndex] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

interface FAQItem {
    question: string;
    answer: string;
    tags: string[];
}

interface FAQCategory {
    category: string;
    items: FAQItem[];
}

const toggleAccordion = (index: string): void => {
    setActiveIndex(activeIndex === index ? null : index);
};

  const filteredData = faqData.map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(category => category.items.length > 0);

  return (
    <div className="min-h-screen mt-20 bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Centre d'Aide Masomo RDC
          </h1>
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Rechercher dans la FAQ..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FiSearch className="absolute right-4 top-4 text-gray-400 text-xl" />
          </div>
        </div>

        {filteredData.map((category, catIndex) => (
          <section key={catIndex} className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-l-4 border-blue-500 pl-3">
              {category.category}
            </h2>
            <div className="space-y-4">
              {category.items.map((item, index) => {
                const uniqueIndex = `${catIndex}-${index}`;
                return (
                  <article 
                    key={uniqueIndex}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <button
                      className="w-full px-6 py-4 text-left flex justify-between items-center"
                      onClick={() => toggleAccordion(uniqueIndex)}
                      aria-expanded={activeIndex === uniqueIndex}
                    >
                      <span className="text-lg font-medium text-gray-900 pr-4">
                        {item.question}
                      </span>
                      {activeIndex === uniqueIndex ? 
                        <FiChevronUp className="text-gray-600 text-xl" /> : 
                        <FiChevronDown className="text-gray-600 text-xl" />
                      }
                    </button>
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        activeIndex === uniqueIndex ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                        <p className="text-gray-600 leading-relaxed">
                          {item.answer}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.tags.map((tag, tagIndex) => (
                            <span 
                              key={tagIndex}
                              className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ))}

        <div className="mt-16 bg-blue-50 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold mb-4">Vous ne trouvez pas votre réponse ?</h3>
          <p className="mb-6">Notre équipe support est disponible 24/7</p>
          <button onClick={
            () => {
              window.location.href = '/pages/contact';
            }
          } className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Contactez le support
          </button>
        </div>
      </main>

      <Footer />
    </div>
  )
}