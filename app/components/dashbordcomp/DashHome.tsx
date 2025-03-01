"use client";
import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

export default function DashHome() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="py-12 text-center">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
        Bienvenue{user ? "," : ", visiteur"}{" "}
        {user && (
          <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            {user.displayName || user.email}
          </span>
        )}
        !
      </h1>
      <p className="text-xl text-gray-700">
        {user
          ? "Nous sommes ravis de vous retrouver sur votre tableau de bord."
          : "Veuillez vous connecter pour accéder à votre espace personnalisé."}
      </p>
    </div>
  );
}
