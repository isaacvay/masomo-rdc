import React from 'react';
import Footer from '@/app/components/footer/Footer';
import { DocumentCheckIcon, 
    ShieldCheckIcon, 
    UserGroupIcon, 
    QrCodeIcon, 
    ChartBarIcon, 
    CloudArrowDownIcon } from '@heroicons/react/24/outline';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen mt-20 bg-gray-50">
      {/* Section Hero */}
      <header className="bg-blue-600 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Fonctionnalités Clés de Masomo RDC
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            Découvrez comment notre plateforme révolutionne la gestion scolaire en RDC
          </p>
        </div>
      </header>

      {/* Principales fonctionnalités */}
      <section className="max-w-7xl mx-auto py-16 px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {[
            { icon: QrCodeIcon, title: "Authenticité des Documents", text: "QR code unique par bulletin pour vérification instantanée" },
            { icon: DocumentCheckIcon, title: "Gestion Automatisée", text: "Génération automatique des bulletins (PDF/HTML)" },
            { icon: ShieldCheckIcon, title: "Sécurité Maximale", text: "Protection anti-falsification des documents scolaires" },
            { icon: UserGroupIcon, title: "Gestion Centralisée", text: "Administration simplifiée des écoles, enseignants et élèves" },
          ].map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.text}</p>
            </div>
          ))}
        </div>

        {/* Détails des fonctionnalités */}
        <div className="grid md:grid-cols-3 gap-12">
          <div className="bg-white p-8 rounded-2xl shadow-md">
            <ChartBarIcon className="h-14 w-14 text-blue-600 mb-6" />
            <h2 className="text-2xl font-bold mb-4">Gestion Scolaire Intelligente</h2>
            <ul className="space-y-4">
              <li>✔️ Enregistrement numérique des notes</li>
              <li>✔️ Calcul automatique des moyennes</li>
              <li>✔️ Historique académique sécurisé</li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-md">
            <DocumentCheckIcon className="h-14 w-14 text-blue-600 mb-6" />
            <h2 className="text-2xl font-bold mb-4">Documents Vérifiables</h2>
            <div className="space-y-4">
              <p>Chaque document généré contient :</p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <QrCodeIcon className="h-20 w-20 mx-auto mb-4" />
                <p className="text-center">Scannez pour vérifier l'authenticité</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-md">
            <CloudArrowDownIcon className="h-14 w-14 text-blue-600 mb-6" />
            <h2 className="text-2xl font-bold mb-4">Accès Multiformat</h2>
            <ul className="space-y-4">
              <li>📄 Export PDF professionnel</li>
              <li>🌐 Version HTML interactive</li>
              <li>☁️ Stockage cloud sécurisé</li>
            </ul>
          </div>
        </div>

        {/* Section Sécurité */}
        <div className="mt-20 bg-blue-50 rounded-2xl p-12 text-center">
          <ShieldCheckIcon className="h-20 w-20 mx-auto text-blue-600 mb-8" />
          <h2 className="text-3xl font-bold mb-6">Sécurité Renforcée</h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Notre système combine chiffrement AES-256 et blockchain pour garantir 
            l'intégrité des données scolaires et prévenir toute tentative de fraude.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Prêt à révolutionner votre gestion scolaire ?</h2>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
            Demander une démo
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}