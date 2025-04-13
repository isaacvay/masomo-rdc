import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc, 
  getDocs 
} from 'firebase/firestore';
import { auth, firestore } from '@/config/firebase';
import DevoirQ from './devoirEl/DevoirQ';
import { formatDate } from '../devoir/utils';

export interface OptionQCM {
  id: number;
  texte: string;
  correcte: boolean;
}

// Ajout de la propriété "points" pour chaque question
export interface Question {
  id: number;
  numero: number;
  enonce: string;
  type: 'texte' | 'qcm';
  points: number;  // Points spécifiques à la question
  options?: OptionQCM[];
}

export interface Devoir {
  id: string; // ID généré par Firestore
  titre: string;
  date: string;
  matiere: string;
  points: number; // Points globaux du devoir
  statut: string;
  questions: Question[];
  hasSubmitted?: boolean; // Pour suivre la soumission
}

export default function DevoirEleve() {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [classe, setClasse] = useState<string | null>(null);
  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
  const [selectedDevoir, setSelectedDevoir] = useState<Devoir | null>(null);
  const [reponsesEleve, setReponsesEleve] = useState<Record<number, string>>({});
  const [refetchTrigger, setRefetchTrigger] = useState(0); // Pour forcer le rechargement

  // Récupération des informations de l'élève
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(firestore, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setSchoolId(userData.schoolId);
        setClasse(userData.classe);
      }
    };

    fetchUserData();
  }, []);

  // Chargement des devoirs depuis Firestore
  useEffect(() => {
    if (!schoolId || !classe) return;

    const devoirsRef = collection(firestore, 'schools', schoolId, 'devoirs');
    const q = query(devoirsRef, where('classe', '==', classe));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const devoirsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Devoir[];

      // Vérifier les soumissions pour chaque devoir
      const devoirsWithSubmission = await Promise.all(
        devoirsList.map(async (devoir) => {
          const reponsesRef = collection(firestore, 'schools', schoolId, 'devoirs', devoir.id, 'reponses');
          const qResp = query(reponsesRef, where('studentId', '==', auth.currentUser?.uid));
          const respSnapshot = await getDocs(qResp);
          const hasSubmitted = !respSnapshot.empty;
          return { ...devoir, hasSubmitted };
        })
      );

      setDevoirs(devoirsWithSubmission);
    });

    return () => unsubscribe();
  }, [schoolId, classe, refetchTrigger]);

  // Fonction pour charger les réponses de l'élève
  const loadReponsesEleve = async (devoirId: string) => {
    const reponsesRef = collection(firestore, 'schools', schoolId || '', 'devoirs', devoirId, 'reponses');
    const q = query(reponsesRef, where('studentId', '==', auth.currentUser?.uid));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const reponseData = snapshot.docs[0].data();
      setReponsesEleve(reponseData.reponses || {});
    } else {
      setReponsesEleve({});
    }
  };

  const handleBack = () => {
    setSelectedDevoir(null);
    setRefetchTrigger((prev) => prev + 1); // Forcer le rechargement pour actualiser l'affichage
  };

  const handleDevoirSelect = (devoir: Devoir) => {
    setSelectedDevoir(devoir);
    if (devoir.id) {
      loadReponsesEleve(devoir.id);
    }
  };

  // Affichage du composant DevoirQ si un devoir est sélectionné
  if (selectedDevoir) {
    return (
      <DevoirQ
        devoir={selectedDevoir}
        onBack={handleBack}
        initialReponses={reponsesEleve}
        schoolId={schoolId}  // passage de la variable schoolId pour l'écriture
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Mes Devoirs</h2>
      <div className="grid gap-4">
        {devoirs.length > 0 ? (
          devoirs.map((devoir) => {
            const currentDate = new Date();
            const devoirDate = new Date(devoir.date);
            const hasSubmitted = devoir.hasSubmitted || false;

            return (
              <div
                key={devoir.id}
                onClick={() => handleDevoirSelect(devoir)}
                className="p-5 border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{devoir.titre}</h3>
                    <p className="text-gray-600">{devoir.matiere}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      hasSubmitted
                        ? 'bg-green-100 text-green-800'
                        : currentDate <= devoirDate
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {hasSubmitted ? 'Rendu' : currentDate <= devoirDate ? 'À rendre' : 'En retard'}
                  </span>
                </div>
                <div className="mt-3 flex items-center text-sm text-gray-500">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {formatDate(devoir.date)}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-gray-600">Aucun devoir disponible pour le moment.</div>
        )}
      </div>
    </div>
  );
}
