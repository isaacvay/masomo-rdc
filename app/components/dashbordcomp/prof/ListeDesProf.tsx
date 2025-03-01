"use client";
import React, { useState, useEffect } from "react";
import { auth, firestore } from "@/config/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import ProfileProf from "./ProfileProf"; // Composant pour afficher le profil du prof

// Interface pour typer un professeur depuis la collection "users"
interface Prof {
  id: string;
  displayName: string;
  email?: string;
  sexe?: string;
  courses?: string[];
  schoolId: string;
  role: string;
}

interface ListeDesProfsProps {}

export default function ListeDesProfs({}: ListeDesProfsProps) {
  const [profs, setProfs] = useState<Prof[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProf, setSelectedProf] = useState<Prof | null>(null);

  useEffect(() => {
    const fetchProfs = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Aucune école connectée");

        // Dans la nouvelle architecture, les professeurs se trouvent dans la collection "users"
        // avec un champ "role" de type "prof" ou "professeur" et un "schoolId" correspondant à l'école.
        const profsCollection = collection(firestore, "users");
        const q = query(
          profsCollection,
          where("schoolId", "==", currentUser.uid),
          where("role", "in", ["prof", "professeur"])
        );
        const snapshot = await getDocs(q);
        const data: Prof[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Prof, "id">),
        }));
        setProfs(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfs();
  }, []);

  // Filtrer les professeurs par recherche (en se basant sur le displayName)
  const filteredProfs = profs.filter((prof) =>
    prof.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex justify-center items-center">
        Chargement...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex justify-center items-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {selectedProf ? (
        <ProfileProf {...selectedProf} onRetour={() => setSelectedProf(null)} />
      ) : (
        <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden">
          {/* En-tête avec barre de recherche */}
          <div className="bg-blue-600 p-4 flex flex-col md:flex-row items-center justify-between">
            <h2 className="text-3xl text-white font-bold mb-2 md:mb-0">
              Liste des professeurs
            </h2>
            <input
              type="text"
              placeholder="Rechercher un professeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/3 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {/* Liste des professeurs */}
          <div className="p-4 text-start">
            <h3 className="px-2 py-5 text-2xl font-semibold text-gray-800">
              <strong className="text-3xl">📋</strong> Liste des professeurs
            </h3>
            <div className="p-4 bg-gray-200 rounded-lg overflow-hidden">
              <ul className="divide-y-4 divide-gray-200 bg-white rounded-lg">
                {filteredProfs.map((prof) => (
                  <li
                    key={prof.id}
                    className="p-4 flex transition hover:bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedProf(prof)}
                  >
                    <div className="flex-1">
                      <p className="text-xl font-medium text-gray-800 uppercase">
                        {prof.displayName}
                      </p>
                      {prof.email && (
                        <p className="text-sm text-gray-500">{prof.email}</p>
                      )}
                    </div>
                  </li>
                ))}
                {filteredProfs.length === 0 && (
                  <li className="p-4 text-center text-gray-500">
                    Aucun professeur trouvé.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
