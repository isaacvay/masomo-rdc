"use client";
import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/config/firebase";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertTriangle, Loader, Eye, EyeOff } from 'lucide-react';
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default function Connexion() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [seSouvenir, setSeSouvenir] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const db = getFirestore();

  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setSeSouvenir(true);
    }
  }, []);

  const isValidEmail = (email: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError("Veuillez entrer une adresse e-mail valide.");
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, motDePasse);
      const user = userCredential.user;
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error("Le document utilisateur est introuvable.");
      }
      const data = docSnap.data() as { role?: string };
      const userRole = data.role || "";
      if (userRole === "ecole") {
        router.push("/dashboardPrin");
      } else if (["prof", "professeur"].includes(userRole)) {
        router.push("/dashboardProf");
      } else if (["eleve", "élève"].includes(userRole)) {
        router.push("/dashboardEleve");
      } else {
        router.push("/dashboard");
      }
      if (seSouvenir) {
        localStorage.setItem("savedEmail", email);
      } else {
        localStorage.removeItem("savedEmail");
      }
    } catch (err) {
      console.error('Erreur lors de la connexion:', err);
      setError("Erreur lors de la connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen mt-5 flex items-center justify-center bg-gradient-to-br from-indigo-100 to-blue-100 relative overflow-hidden p-4">
      <div className="absolute inset-0 z-0 flex justify-center items-center">
        <div className="w-72 h-72 sm:w-96 sm:h-96 bg-indigo-200/40 rounded-full blur-3xl animate-float"></div>
      </div>

      <div className="relative z-10 bg-white p-6 sm:p-10 rounded-3xl shadow-xl w-full max-w-md border border-gray-200 backdrop-blur-md transition-all duration-300 hover:shadow-2xl">
        <div className="flex flex-col items-center mb-6 space-y-4">
          <div className="p-4 bg-indigo-200 rounded-full shadow-inner">
            <Lock className="w-8 h-8 text-indigo-600 animate-bounce" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Connexion</h1>
          <p className="text-gray-500 text-sm">Accédez à votre espace personnel</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
            <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-5 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-0"
              placeholder="Adresse e-mail"
              required
            />
          </div>

          <div className="relative">
            <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              id="motDePasse"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-0"
              placeholder="Mot de passe"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="seSouvenir"
              checked={seSouvenir}
              onChange={() => setSeSouvenir(!seSouvenir)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="seSouvenir" className="text-sm text-gray-600">Se souvenir de moi</label>
          </div>
          
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-100 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-red-500 text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Connexion...</span>
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Nouveau ?{' '}
            <a href="/pages/inscription" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Créer un compte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
