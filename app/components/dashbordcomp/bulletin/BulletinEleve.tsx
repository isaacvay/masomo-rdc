"use client";
import React, { useState, useEffect } from "react";
import BulletinAffiche from "./BulletinAffiche";
import { auth, firestore } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";

// Interface décrivant le profil d'un étudiant (stocké dans "users")
interface Student {
  displayName: string;
  sexe: string;
  neEA: string;
  naissance: string;
  section: string;
  classe: string;
  numPerm: string;
  email: string;
  schoolId: string;
  paiement?: boolean; // Si true, le bulletin n'est pas disponible
}

// Interface décrivant les informations d'une école (stockées dans "schools")
interface SchoolInfo {
  province: string;
  ville: string;
  commune: string;
  nom: string;   // le nom de l'école
  code: string;
  // Ajoutez d'autres champs si nécessaire
}

export default function BulletinEleve() {
  const [student, setStudent] = useState<Student | null>(null);
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!auth.currentUser) throw new Error("Aucun utilisateur connecté");
        console.log("Utilisateur connecté :", auth.currentUser.uid);

        // Récupérer le profil étudiant depuis "users"
        const userRef = doc(firestore, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) throw new Error("Utilisateur non trouvé");
        const userData = userSnap.data() as Student;
        console.log("Données utilisateur :", userData);
        if (!userData.schoolId) throw new Error("Aucune école associée à cet utilisateur");

        setStudent(userData);

        // Récupérer les informations de l'école depuis "schools"
        const schoolRef = doc(firestore, "schools", userData.schoolId);
        const schoolSnap = await getDoc(schoolRef);
        if (!schoolSnap.exists()) throw new Error("École non trouvée");
        const schoolData = schoolSnap.data() as SchoolInfo;
        console.log("Données école :", schoolData);
        setSchool(schoolData);
      } catch (err: any) {
        console.error("Erreur Firestore :", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!student) return <div>Profil étudiant non disponible</div>;
  if (!school) return <div>Informations sur l'école non disponibles</div>;

  // Si le champ "paiement" est true, afficher un message d'alerte
  if (student.paiement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="max-w-xl bg-white shadow-xl rounded-xl p-6 text-center">
          <h1 className="text-2xl font-bold text-red-600">Attention</h1>
          <p className="mt-4 text-lg">
            Votre bulletin n'est pas disponible. Veuillez contacter la comptablité pour plus d'informations.
          </p>
        </div>
      </div>
    );
  }

  return <BulletinAffiche selectedStudent={student} schoolInfo={school} />;
}
