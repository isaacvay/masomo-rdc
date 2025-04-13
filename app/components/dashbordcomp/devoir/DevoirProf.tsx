// DevoirProf.tsx
"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { auth, firestore } from '@/config/firebase';
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import DevoirProfListe from './DevoirProfListe';
import DevoirProfDetail from './DevoirProfDetail';
import DevoirProfCorrection from './DevoirProfCorrection';
import DevoirProfForm from './DevoirProfForm';

export interface OptionQCM {
  id: string;
  texte: string;
  correcte: boolean;
}

export interface Question {
  id: string;
  numero: number;
  enonce: string;
  type: 'texte' | 'qcm';
  points: number;
  options?: OptionQCM[];
}

export interface Devoir {
  id: string;
  titre: string;
  date: string;
  matiere: string;
  classe: string;
  statut: string;
  questions: Question[];
}

interface DevoirProfProps {
  cours: string;
  classe: string;
  onBack: () => void;
}

const DevoirProf: React.FC<DevoirProfProps> = ({ cours, classe, onBack }) => {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
  const [selectedDevoir, setSelectedDevoir] = useState<Devoir | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chargement de l'ID de l'école
  const loadSchoolId = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("Aucun utilisateur connecté");
        return;
      }
      
      const q = query(
        collection(firestore, "users"),
        where("email", "==", currentUser.email),
        where("role", "==", "professeur")
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const profData = snapshot.docs[0].data();
        setSchoolId(profData.schoolId || currentUser.uid);
      } else {
        setSchoolId(currentUser.uid);
      }
    } catch (err) {
      console.error("Error fetching professor:", err);
      setError("Erreur lors du chargement des données de l'école");
      setSchoolId(auth.currentUser?.uid || null);
    }
  }, []);

  useEffect(() => {
    loadSchoolId();
  }, [loadSchoolId]);

  // Gestion des devoirs
  const handleDevoirsSnapshot = useCallback((snapshot: any) => {
    try {
      const loadedDevoirs = snapshot.docs.map((docSnap: any) => {
        const data = docSnap.data() as Omit<Devoir, "id">;
        
        // Calcul du statut basé sur la date
        const now = new Date();
        const devoirDate = new Date(data.date);
        const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const devoirStart = new Date(devoirDate.getFullYear(), devoirDate.getMonth(), devoirDate.getDate());
        
        let statut = "default";
        if (devoirStart > nowStart) {
          statut = "À rendre";
        } else if (devoirStart < nowStart) {
          statut = "Rendu";
        } else {
          statut = "À rendre"; // Considéré comme "À rendre" le jour même
        }
  
        return {
          id: docSnap.id,
          ...data,
          statut: statut,
        };
      });
      
      setDevoirs(loadedDevoirs);
      setLoading(false);
    } catch (err) {
      console.error("Erreur lors du traitement des devoirs:", err);
      setError("Erreur lors du traitement des devoirs");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!schoolId) return;

    const devoirsRef = collection(firestore, "schools", schoolId, "devoirs");
    const qDevoirs = query(
      devoirsRef,
      where("matiere", "==", cours),
      where("classe", "==", classe)
    );
    
    const unsubscribe = onSnapshot(
      qDevoirs,
      handleDevoirsSnapshot,
      (err: any) => {
        console.error("Error loading assignments:", err);
        setError("Erreur lors du chargement des devoirs");
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [schoolId, cours, classe, handleDevoirsSnapshot]);

  // Création d'un nouveau devoir
  const handleCreateDevoir = useCallback(async (newDevoir: Omit<Devoir, "id">) => {
    if (!schoolId) {
      setError("ID de l'école non disponible");
      return;
    }
    
    try {
      setLoading(true);
      const devoirDocRef = doc(collection(firestore, "schools", schoolId, "devoirs"));
      await setDoc(devoirDocRef, newDevoir);
      setIsCreating(false);
    } catch (err) {
      console.error("Error creating assignment:", err);
      setError("Erreur lors de la création du devoir");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  // Mise à jour d'un devoir existant
  const handleUpdateDevoir = useCallback(async (updatedDevoir: Omit<Devoir, "id">) => {
    if (!schoolId || !selectedDevoir) {
      setError("Données insuffisantes pour la mise à jour");
      return;
    }
    
    try {
      setLoading(true);
      const devoirDocRef = doc(firestore, "schools", schoolId, "devoirs", selectedDevoir.id);
      await setDoc(devoirDocRef, updatedDevoir);
      setIsEditing(false);
      setSelectedDevoir({ ...selectedDevoir, ...updatedDevoir });
    } catch (err) {
      console.error("Error updating assignment:", err);
      setError("Erreur lors de la mise à jour du devoir");
    } finally {
      setLoading(false);
    }
  }, [schoolId, selectedDevoir]);

  const currentView = useMemo(() => {
    if (isCreating) {
      return (
        <DevoirProfForm
          cours={cours}
          classe={classe}
          onCancel={() => setIsCreating(false)}
          onSubmit={handleCreateDevoir}
        />
      );
    }
    
    if (isEditing && selectedDevoir) {
      return (
        <DevoirProfForm
          cours={cours}
          classe={classe}
          initialData={selectedDevoir}
          onCancel={() => setIsEditing(false)}
          onSubmit={handleUpdateDevoir}
        />
      );
    }
    
    if (selectedDevoir) {
      return showCorrection ? (
        <DevoirProfCorrection
          devoir={selectedDevoir}
          schoolId={schoolId || ''}
          onBack={() => setShowCorrection(false)}
        />
      ) : (
        <DevoirProfDetail
          devoir={selectedDevoir}
          onBack={() => setSelectedDevoir(null)}
          onShowCorrection={() => setShowCorrection(true)}
          onEdit={() => setIsEditing(true)}
        />
      );
    }
    
    return (
      <DevoirProfListe
        devoirs={devoirs}
        onSelect={setSelectedDevoir}
        onCreate={() => setIsCreating(true)}
      />
    );
  }, [
    isCreating, 
    isEditing,
    selectedDevoir, 
    showCorrection, 
    devoirs, 
    cours, 
    classe, 
    schoolId, 
    handleCreateDevoir,
    handleUpdateDevoir
  ]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-500 mb-6 hover:text-blue-700 transition-colors"
            aria-label="Retour à mes cours"
          >
            <FaArrowLeft /> Retour à mes cours
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-500 mb-6 hover:text-blue-700 transition-colors"
          aria-label="Retour à mes cours"
        >
          <FaArrowLeft /> Retour à mes cours
        </button>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Devoirs pour {cours} - {classe}
        </h1>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          currentView
        )}
      </div>
    </div>
  );
};

export default DevoirProf;
