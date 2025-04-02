"use client";

import React, { useState, useEffect } from "react";
import { auth, firestore } from "@/config/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  Loader2,
  MapPin,
  School,
  Shield,
  Mail,
  Lock,
  Hash,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const provincesRDC = [
  "Kinshasa",
  "Kongo-Central",
  "Kwango",
  "Kwilu",
  "Mai-Ndombe",
  "Kasaï",
  "Kasaï-Central",
  "Kasaï-Oriental",
  "Lomami",
  "Sankuru",
  "Maniema",
  "Sud-Kivu",
  "Nord-Kivu",
  "Ituri",
  "Haut-Uele",
  "Tshopo",
  "Bas-Uele",
  "Nord-Ubangi",
  "Mongala",
  "Sud-Ubangi",
  "Equateur",
  "Tshuapa",
  "Tanganyika",
  "Haut-Lomami",
  "Lualaba",
  "Haut-Katanga",
];

export default function EcoleSignup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    ecole: "",
    province: "",
    ville: "",
    commune: "",
    code: "",
    email: "",
    motDePasse: "",
    confirmMotDePasse: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Génération automatique de l'email à partir du nom de l'école
  useEffect(() => {
    if (formData.ecole) {
      const emailGenerated =
        formData.ecole.toLowerCase().replace(/\s+/g, "") + "@masomordc.com";
      setFormData((prev) => ({ ...prev, email: emailGenerated }));
    } else {
      setFormData((prev) => ({ ...prev, email: "" }));
    }
  }, [formData.ecole]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.motDePasse !== formData.confirmMotDePasse) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    try {
      // Création du compte école dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.motDePasse
      );
      const user = userCredential.user;

      // Mise à jour du profil avec le nom de l'école
      await updateProfile(user, { displayName: formData.ecole });

      // Préparation des données pour le document utilisateur dans "users"
      const userData = {
        uid: user.uid,
        role: "école",
        displayName: formData.ecole,
        email: formData.email,
        password: formData.motDePasse, // Mot de passe stocké en clair (à sécuriser en production)
        createdAt: new Date(),
      };

      // Enregistrement dans la collection "users"
      await setDoc(doc(firestore, "users", user.uid), userData);

      // Préparation des données spécifiques à l'école
      const schoolData = {
        nom: formData.ecole,
        province: formData.province,
        ville: formData.ville,
        commune: formData.commune,
        code: formData.code,
        email: formData.email,
        password: formData.motDePasse, // Mot de passe stocké en clair
        uid: user.uid,
        createdAt: new Date(),
      };

      // Enregistrement dans la collection "schools"
      await setDoc(doc(firestore, "schools", user.uid), schoolData);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);

      // Réinitialisation du formulaire
      setFormData({
        ecole: "",
        province: "",
        ville: "",
        commune: "",
        code: "",
        email: "",
        motDePasse: "",
        confirmMotDePasse: "",
      });

      // Redirection vers le dashboard de l'école
      router.push("/dashboardPrin");
    } catch (error: any) {
      console.error("Erreur lors de l'inscription :", error);
      setError(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto my-24 p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center bg-blue-100 p-4 rounded-full mb-4">
          <School className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Enregistrement École
        </h1>
        <p className="text-gray-500">
          Formulaire d'enregistrement pour les établissements scolaires de la RDC
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-600 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-green-600 text-sm">
            École enregistrée avec succès ! Redirection en cours...
          </span>
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nom de l'école */}
          <div className="relative">
            <label
              htmlFor="ecole"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nom officiel de l'école
            </label>
            <div className="relative">
              <School className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
              <input
                id="ecole"
                type="text"
                value={formData.ecole}
                onChange={handleChange}
                placeholder="Nom officiel de l'école"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Code Ministère */}
          <div className="relative">
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Code Ministère
            </label>
            <div className="relative">
              <Hash className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
              <input
                id="code"
                type="text"
                value={formData.code}
                onChange={handleChange}
                placeholder="Code Ministère"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Localisation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label
              htmlFor="province"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Province
            </label>
            <div className="relative">
              <MapPin className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
              <select
                id="province"
                value={formData.province}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionnez une province</option>
                {provincesRDC.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="ville"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Ville/Territoire
            </label>
            <input
              id="ville"
              type="text"
              value={formData.ville}
              onChange={handleChange}
              placeholder="Ville ou Territoire"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="commune"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Commune/Chefferie
            </label>
            <input
              id="commune"
              type="text"
              value={formData.commune}
              onChange={handleChange}
              placeholder="Commune ou Chefferie"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Email institutionnel généré automatiquement */}
        <div className="relative">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email institutionnel
          </label>
          <div className="relative">
            <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
            <input
              id="email"
              type="email"
              value={formData.email}
              readOnly
              placeholder="Email institutionnel"
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Mot de passe */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <label
              htmlFor="motDePasse"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
              <input
                id="motDePasse"
                type="password"
                value={formData.motDePasse}
                onChange={handleChange}
                placeholder="Mot de passe"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="relative">
            <label
              htmlFor="confirmMotDePasse"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirmation
            </label>
            <div className="relative">
              <Shield className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
              <input
                id="confirmMotDePasse"
                type="password"
                value={formData.confirmMotDePasse}
                onChange={handleChange}
                placeholder="Confirmer le mot de passe"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-200 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                Création du compte...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Enregistrer l'établissement
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
