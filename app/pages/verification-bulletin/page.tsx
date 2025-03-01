"use client";
import React, { useState, useEffect } from 'react';
import { Bulletin, BulletinDisplay } from '../../components/dashbordcomp/bulletin/BulletinDisplay';

const MOCK_BULLETINS: Bulletin[] = [
  {
    id: 1,
    code: 'KIN2023-456',
    eleve: "Mwanza Ntumba Jean",
    classe: "8ème Scientifique",
    ecole: "Institut Lumumba",
    annee: "2022-2023",
    matieres: [
      { nom: "Mathématiques", coefficient: 5, note: 72 },
      { nom: "Physique-Chimie", coefficient: 4, note: 68 },
      { nom: "Français", coefficient: 3, note: 65 },
      { nom: "Histoire/Géographie", coefficient: 2, note: 85 },
    ]
  },
];

const QrCodeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
  </svg>
);

const ExclamationTriangleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

export default function VerificateurBulletin() {
  const [code, setCode] = useState('');
  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const verifyCode = (codeToVerify: string) => {
    setError('');
    const foundBulletin = MOCK_BULLETINS.find((b) => b.code === codeToVerify);
    
    if (foundBulletin) {
      setBulletin(foundBulletin);
    } else {
      setError('Code invalide - Bulletin non reconnu');
      setBulletin(null);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCode(code);
  };

  const simulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setCode('KIN2023-456');
      setIsScanning(false);
    }, 1500);
  };

  useEffect(() => {
    if (code.length === 0) setError('');
  }, [code]);

  return (
    <div className="min-h-[70vh] bg-gradient-to-br mt-20 from-blue-50 to-yellow-50 flex items-start justify-center p-8">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl">
        <header className="p-8 bg-blue-600 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-lg">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Flag_of_the_Democratic_Republic_of_the_Congo.svg/1200px-Flag_of_the_Democratic_Republic_of_the_Congo.svg.png" 
                alt="Drapeau RDC" 
                className="h-12 w-16 object-cover"
              />
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">SYSTÈME NATIONAL DE VÉRIFICATION DES BULLETINS</h1>
              <p className="text-sm">Ministère de l'Enseignement Primaire, Secondaire et Technique</p>
            </div>
          </div>
        </header>

        <main className="p-8">
          <form onSubmit={handleFormSubmit} className="mb-8">
            <div className="bg-blue-50 p-6 rounded-xl">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Entrez le code du bulletin"
                    className="w-full px-6 py-4 pl-12 text-lg border-2 border-blue-200/50 hover:border-blue-300 focus:border-blue-500 rounded-xl focus:ring-4 focus:ring-blue-100/50 placeholder:text-blue-400/70 transition-all duration-200 bg-white/90 shadow-sm hover:shadow-md focus:shadow-lg"
                    autoComplete="off"
                  />

                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                    {code && (
                      <button
                        type="button"
                        onClick={() => setCode('')}
                        className="p-1 text-blue-400 hover:text-blue-600 transition-colors"
                        aria-label="Effacer"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={simulateScan}
                      disabled={isScanning}
                      className={`p-2 rounded-lg ${
                        isScanning 
                          ? 'text-blue-400 cursor-wait'
                          : 'text-blue-600 hover:bg-blue-50'
                      } transition-colors`}
                    >
                      {isScanning ? (
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <QrCodeIcon className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-8 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                  <CheckIcon className="w-6 h-6" />
                  Vérifier
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-center gap-3 animate-fade-in">
                  <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Erreur de vérification</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </form>

          {bulletin && <BulletinDisplay bulletin={bulletin} />}

          <div className="mt-8 text-center text-sm text-gray-600">
            <p>Système officiel de vérification - Toute falsification est passible de poursuites judiciaires</p>
            <p className="mt-2">© Ministère de l'EPST - RDC {new Date().getFullYear()}</p>
          </div>
        </main>
      </div>
    </div>
  );
}