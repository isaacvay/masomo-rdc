"use client";
import React, { useState } from "react";
import { auth, firestore } from "@/config/firebase";
import { secondaryAuth } from "@/config/firebaseSecondary";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { sections } from "@/data/cours";

// Fonction utilitaire pour générer un mot de passe aléatoire
const generateRandomPassword = (length = 8): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
};

export default function AddEleve() {
  const [name, setName] = useState<string>("");
  const [sexe, setSexe] = useState<string>("");
  const [neEA, setNeEA] = useState<string>("");
  const [naissance, setNaissance] = useState<string>("");
  const [section, setSection] = useState<string>("");
  const [classe, setClasse] = useState<string>("");
  const [numPerm, setNumPerm] = useState<string>("");

  // Options pour le sélecteur "Section"
  const sectionOptions: string[] = Array.from(
    new Set(sections.map((sec) => sec.category))
  );

  // Options pour le sélecteur "Classe" en fonction de la section sélectionnée
  const classeOptions: string[] = section
    ? sections.filter((sec) => sec.category === section).flatMap((sec) => sec.classe)
    : [];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("Veuillez vous connecter en tant qu'école pour ajouter un élève.");
      return;
    }
    try {
      // Génération du mot de passe
      const password = generateRandomPassword();

      // Génération de l'email de base sans suffixe
      const baseEmail = `${name.toLowerCase().replace(/\s+/g, "")}@elev.masomordc.cd`;
      let email = baseEmail;

      // Vérification de l'existence de l'email
      const signInMethods = await fetchSignInMethodsForEmail(secondaryAuth, email);
      if (signInMethods.length > 0) {
        // Si l'email existe, ajouter un suffixe aléatoire
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        email = `${name.toLowerCase().replace(/\s+/g, "")}.${randomSuffix}@elev.masomordc.cd`;
      }

      // Création du compte élève avec l'instance secondaire
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password
      );
      const user = userCredential.user;

      // Mise à jour du profil (affichage du nom de l'élève)
      await updateProfile(user, { displayName: name });

      // Récupérer l'UID de l'école (compte connecté)
      const schoolId = auth.currentUser.uid;

      // Préparation des données de l'élève pour le document "users"
      const eleveData = {
        uid: user.uid,
        role: "élève",
        displayName: name,
        sexe,
        neEA,
        naissance,
        section,
        classe,
        numPerm,
        email,
        password, // Ajout du mot de passe
        schoolId, // Ajout du schoolId
        createdAt: new Date(),
      };

      // Écriture dans la collection "users"
      await setDoc(doc(firestore, "users", user.uid), eleveData);

      // Déconnexion de l'instance secondaire pour ne pas affecter la session école
      await signOut(secondaryAuth);

      alert(`Élève ajouté avec succès !
Email : ${email}
Mot de passe : ${password}`);

      // Réinitialisation des champs
      setName("");
      setSexe("");
      setNeEA("");
      setNaissance("");
      setSection("");
      setClasse("");
      setNumPerm("");
    } catch (error: unknown) {
      console.error("Erreur lors de l'ajout de l'élève :", error);
      alert("Une erreur est survenue lors de la création de l'élève. Veuillez réessayer.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-md mt-10">
      <h2 className="text-xl font-bold mb-6 text-center">Ajouter un Élève</h2>
      <form onSubmit={handleSubmit}>
        {/* Champ pour le nom */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 font-semibold mb-1">
            Nom de l'élève :
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom de l'élève"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Sexe */}
        <div className="mb-4">
          <label htmlFor="sexe" className="block text-gray-700 font-semibold mb-1">
            Sexe :
          </label>
          <select
            id="sexe"
            value={sexe}
            onChange={(e) => setSexe(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">-- Sélectionnez --</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>
        </div>

        {/* NE (E) A */}
        <div className="mb-4">
          <label htmlFor="neEA" className="block text-gray-700 font-semibold mb-1">
            NE (E) A :
          </label>
          <input
            type="text"
            id="neEA"
            value={neEA}
            onChange={(e) => setNeEA(e.target.value)}
            placeholder="Lieu de naissance"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Date de naissance */}
        <div className="mb-4">
          <label htmlFor="naissance" className="block text-gray-700 font-semibold mb-1">
            Né(e) le :
          </label>
          <input
            type="date"
            id="naissance"
            value={naissance}
            onChange={(e) => setNaissance(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Section */}
        <div className="mb-4">
          <label htmlFor="section" className="block text-gray-700 font-semibold mb-1">
            Section :
          </label>
          <select
            id="section"
            value={section}
            onChange={(e) => {
              setSection(e.target.value);
              setClasse(""); // Réinitialiser la classe si la section change
            }}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">-- Sélectionnez une section --</option>
            {sectionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Classe */}
        <div className="mb-4">
          <label htmlFor="classe" className="block text-gray-700 font-semibold mb-1">
            Classe :
          </label>
          <select
            id="classe"
            value={classe}
            onChange={(e) => setClasse(e.target.value)}
            required
            disabled={!section}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">-- Sélectionnez une classe --</option>
            {classeOptions.map((cl) => (
              <option key={cl} value={cl}>
                {cl}
              </option>
            ))}
          </select>
        </div>

        {/* Numéro de permis */}
        <div className="mb-4">
          <label htmlFor="numPerm" className="block text-gray-700 font-semibold mb-1">
            Numéro de permis :
          </label>
          <input
            type="text"
            id="numPerm"
            value={numPerm}
            onChange={(e) => setNumPerm(e.target.value)}
            placeholder="Numéro de permis"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200"
        >
          Ajouter l'élève
        </button>
      </form>
    </div>
  );
}
