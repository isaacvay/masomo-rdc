import React from 'react'

export default function Page() {
  return (
    <div className="container mx-auto px-4 mt-14 sm:px-6 lg:px-8 py-12 max-w-5xl">
      <div className="bg-white shadow-lg rounded-xl p-8 sm:p-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Politique de Confidentialité de <span className="text-indigo-600">Masomo RDC</span>
          </h1>
          <p className="text-gray-500 text-sm">
            <strong>Dernière mise à jour :</strong> [Date]
          </p>
        </header>

        <nav className="mb-12 bg-indigo-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-indigo-800 mb-4">Table des matières</h2>
          <ul className="space-y-2 list-decimal list-inside text-indigo-600">
            {[
              'Responsable de Traitement',
              'Données Collectées et Finalités',
              'Bases Légales du Traitement',
              'Durée de Conservation des Données',
              'Partage et Transfert des Données',
              'Sécurité des Données',
              'Vos Droits',
              'Utilisation de Cookies',
              'Modifications de la Politique',
              'Contact'
            ].map((title, index) => (
              <li key={index}>
                <a 
                  href={`#section-${index + 1}`} 
                  className="hover:text-indigo-800 transition-colors"
                >
                  {title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <section className="space-y-12">
          {/* Section 1 */}
          <article id="section-1" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-indigo-200">
              1. Responsable de Traitement
            </h2>
            <div className="space-y-4 text-gray-700">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900">
                  <span className="text-indigo-600">Masomo RDC</span><br />
                  Adresse : [Votre adresse complète]<br />
                  Email : [votre.email@masomordc.com]
                </p>
              </div>
              <p>
                Le responsable de traitement est chargé de la collecte et du traitement des données personnelles conformément à la législation applicable.
              </p>
            </div>
          </article>

          {/* Section 2 */}
          <article id="section-2" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-indigo-200">
              2. Données Collectées et Finalités
            </h2>
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">a. Données Personnelles</h3>
                <p>
                  Nous collectons diverses informations relatives aux utilisateurs afin de permettre une gestion efficace et sécurisée de la plateforme :
                </p>
                <ul className="space-y-3 pl-6">
                  <li className="flex items-start">
                    <span className="text-indigo-600 mr-2 mt-1">•</span>
                    <div>
                      <strong>Informations d’identification :</strong> nom, prénom, identifiant, adresse email, numéro de téléphone
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-600 mr-2 mt-1">•</span>
                    <div>
                      <strong>Informations scolaires :</strong> notes, bulletins, informations sur les classes
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-600 mr-2 mt-1">•</span>
                    <div>
                      <strong>Données d’authentification :</strong> identifiants de connexion sécurisés
                    </div>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">b. Finalités du Traitement</h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  <li className="flex items-start p-4 bg-indigo-50 rounded-lg">
                    <span className="text-indigo-600 mr-2 mt-1">✓</span>
                    Gestion des comptes utilisateurs
                  </li>
                  <li className="flex items-start p-4 bg-indigo-50 rounded-lg">
                    <span className="text-indigo-600 mr-2 mt-1">✓</span>
                    Traitement des informations scolaires
                  </li>
                  <li className="flex items-start p-4 bg-indigo-50 rounded-lg">
                    <span className="text-indigo-600 mr-2 mt-1">✓</span>
                    Authentification des documents
                  </li>
                  <li className="flex items-start p-4 bg-indigo-50 rounded-lg">
                    <span className="text-indigo-600 mr-2 mt-1">✓</span>
                    Amélioration des services
                  </li>
                </ul>
              </div>
            </div>
          </article>

          {/* Section 3 */}
          <article id="section-3" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-indigo-200">
              3. Bases Légales du Traitement
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>Le traitement de vos données personnelles repose sur :</p>
              <ul className="grid gap-4 sm:grid-cols-2">
                <li className="p-4 bg-indigo-50 rounded-lg flex items-start">
                  <span className="text-indigo-600 mr-2 mt-1">•</span>
                  Consentement explicite de l'utilisateur
                </li>
                <li className="p-4 bg-indigo-50 rounded-lg flex items-start">
                  <span className="text-indigo-600 mr-2 mt-1">•</span>
                  Nécessité contractuelle
                </li>
                <li className="p-4 bg-indigo-50 rounded-lg flex items-start">
                  <span className="text-indigo-600 mr-2 mt-1">•</span>
                  Obligations légales
                </li>
              </ul>
            </div>
          </article>

          {/* Section 4 */}
          <article id="section-4" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-indigo-200">
              4. Durée de Conservation des Données
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Vos données personnelles sont conservées pour la durée nécessaire à la réalisation des finalités pour lesquelles elles ont été collectées, et conformément aux exigences légales.
              </p>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="font-medium text-indigo-800">
                  Critères de conservation :<br />
                  <span className="text-gray-700 font-normal">
                    - Activité du compte utilisateur<br />
                    - Exigences légales spécifiques<br />
                    - Nécessité opérationnelle
                  </span>
                </p>
              </div>
            </div>
          </article>

          {/* Section 5 */}
          <article id="section-5" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-indigo-200">
              5. Partage et Transfert des Données
            </h2>
            <div className="space-y-6 text-gray-700">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">a. Partage avec des Tiers</h3>
                <ul className="space-y-3 pl-6">
                  <li className="flex items-start">
                    <span className="text-indigo-600 mr-2 mt-1">•</span>
                    Établissements scolaires partenaires
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-600 mr-2 mt-1">•</span>
                    Prestataires techniques sous contrat
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">b. Transferts Internationaux</h3>
                <p className="bg-indigo-50 p-4 rounded-lg">
                  Tout transfert international s'effectue dans le respect du RGPD avec des clauses contractuelles types de la Commission européenne.
                </p>
              </div>
            </div>
          </article>

          {/* Section 6 */}
          <article id="section-6" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-indigo-200">
              6. Sécurité des Données
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>Mesures de sécurité mises en œuvre :</p>
              <ul className="grid gap-4 sm:grid-cols-2">
                <li className="p-4 bg-indigo-50 rounded-lg flex items-start">
                  <span className="text-indigo-600 mr-2 mt-1">🔒</span>
                  Cryptage AES-256 des données sensibles
                </li>
                <li className="p-4 bg-indigo-50 rounded-lg flex items-start">
                  <span className="text-indigo-600 mr-2 mt-1">🛡️</span>
                  Authentification à deux facteurs
                </li>
                <li className="p-4 bg-indigo-50 rounded-lg flex items-start">
                  <span className="text-indigo-600 mr-2 mt-1">📅</span>
                  Audits de sécurité trimestriels
                </li>
                <li className="p-4 bg-indigo-50 rounded-lg flex items-start">
                  <span className="text-indigo-600 mr-2 mt-1">🚨</span>
                  Système de détection d'intrusion
                </li>
              </ul>
            </div>
          </article>

          {/* Section 7 */}
          <article id="section-7" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-indigo-200">
              7. Vos Droits
            </h2>
            <div className="space-y-4 text-gray-700">
              <ul className="grid gap-4 sm:grid-cols-2">
                <li className="p-4 bg-indigo-50 rounded-lg">
                  <strong className="block text-indigo-600 mb-1">Accès</strong>
                  Obtenir une copie de vos données
                </li>
                <li className="p-4 bg-indigo-50 rounded-lg">
                  <strong className="block text-indigo-600 mb-1">Rectification</strong>
                  Corriger les informations inexactes
                </li>
                <li className="p-4 bg-indigo-50 rounded-lg">
                  <strong className="block text-indigo-600 mb-1">Effacement</strong>
                  Suppression sous 30 jours
                </li>
                <li className="p-4 bg-indigo-50 rounded-lg">
                  <strong className="block text-indigo-600 mb-1">Portabilité</strong>
                  Format CSV/JSON disponible
                </li>
              </ul>
              <p className="text-sm text-gray-500">
                Délai maximal de réponse : 1 mois à compter de la réception de votre demande
              </p>
            </div>
          </article>

          {/* Section 8 */}
          <article id="section-8" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-indigo-200">
              8. Utilisation de Cookies
            </h2>
            <div className="space-y-4 text-gray-700">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="font-medium text-indigo-800 mb-2">Types de cookies utilisés :</p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-indigo-600 mr-2 mt-1">•</span>
                    Cookies de session (essentiels)
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-600 mr-2 mt-1">•</span>
                    Cookies analytiques (Google Analytics)
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-600 mr-2 mt-1">•</span>
                    Cookies de préférences
                  </li>
                </ul>
              </div>
              <p>
                Gestion via les paramètres du navigateur ou notre gestionnaire de cookies.
              </p>
            </div>
          </article>

          {/* Section 9 */}
          <article id="section-9" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-indigo-200">
              9. Modifications de la Politique
            </h2>
            <div className="space-y-4 text-gray-700">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="font-medium text-indigo-800">Processus de mise à jour :</p>
                <ul className="list-disc list-inside pl-4 mt-2">
                  <li>Notification par email 30 jours avant</li>
                  <li>Version archivée disponible sur demande</li>
                  <li>Avis de modification visible sur la plateforme</li>
                </ul>
              </div>
            </div>
          </article>

          {/* Section 10 */}
          <article id="section-10" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-indigo-200">
              10. Contact
            </h2>
            <div className="space-y-4">
              <div className="bg-indigo-50 rounded-xl p-6">
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Pour toute question relative à cette politique :
                </p>
                <div className="space-y-1">
                  <p className="flex items-center">
                    <span className="mr-2">📧</span>
                    [votre.email@masomordc.com]
                  </p>
                  <p className="flex items-center">
                    <span className="mr-2">📍</span>
                    [Votre adresse complète]
                  </p>
                </div>
              </div>
              <p className="text-gray-600">
                En utilisant Masomo RDC, vous acceptez les termes de cette politique de confidentialité.
              </p>
            </div>
          </article>
        </section>

        <footer className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 italic">
            *Ce document constitue un cadre général. Pour toute précision supplémentaire, n’hésitez pas à nous contacter.*
          </p>
        </footer>
      </div>
    </div>
  )
}