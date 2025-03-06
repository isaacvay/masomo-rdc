"use client";
import React, { useState, useEffect } from "react";
import { auth, firestore } from "@/config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import ProfileProf from "./ProfileProf";
import ListeProfMP from "./ListeProfMP";
import { HiMagnifyingGlass, HiPrinter } from "react-icons/hi2";

interface Prof {
  id: string;
  displayName: string;
  email?: string;
  sexe?: string;
  courses?: string[];
  schoolId: string;
  role: string;
  password?: string;
}

export default function ListeDesProfs() {
  const [profs, setProfs] = useState<Prof[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProf, setSelectedProf] = useState<Prof | null>(null);
  const [showListeProfMP, setShowListeProfMP] = useState(false);

  useEffect(() => {
    const fetchProfs = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Aucune école connectée");

        const q = query(
          collection(firestore, "users"),
          where("schoolId", "==", currentUser.uid),
          where("role", "in", ["prof", "professeur"])
        );
        
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Prof[];
        setProfs(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfs();
  }, []);

  const filteredProfs = profs.filter(prof =>
    prof.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {showListeProfMP ? (
        <ListeProfMP profs={filteredProfs} onRetour={() => setShowListeProfMP(false)} />
      ) : selectedProf ? (
        <ProfileProf {...selectedProf} onRetour={() => setSelectedProf(null)} />
      ) : (
        <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-lg">
          {/* Header */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
                  Liste des professeurs
              </h2>
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <div className="relative w-full md:w-72">
                  <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-3 w-full rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <button
                  onClick={() => setShowListeProfMP(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full transition w-full md:w-auto"
                >
                  <HiPrinter className="text-xl" />
                  <span>Imprimer la liste</span>
                </button>
              </div>
            </div>
          </div>

          {/* Liste des profs */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center py-4">{error}</div>
            ) : (
              <div className="pb-4">
                {filteredProfs.map((prof) => (
                  <div
                    key={prof.id}
                    className="bg-slate-50 mb-2 p-4 rounded-2xl shadow-sm hover:shadow-lg transition cursor-pointer"
                    onClick={() => setSelectedProf(prof)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 rounded-full p-3">
                        <svg
                          className="w-8 h-8 text-blue-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 uppercase">
                          {prof.displayName}
                        </h3>
                        {prof.email && (
                          <p className="text-sm text-slate-500">{prof.email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredProfs.length === 0 && (
                  <div className="col-span-full text-center text-slate-500 py-4">
                    Aucun professeur trouvé
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
