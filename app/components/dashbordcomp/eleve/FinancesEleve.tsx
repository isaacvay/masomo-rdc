"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FiPrinter, FiDownload, FiFilter, FiCalendar, FiDollarSign } from "react-icons/fi";
import { auth, firestore } from "@/config/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

interface Paiement {
  id: string;
  datePaiement: string;
  montant: number;
  paye: number;
  status: string;
  mois: string;
  modePaiement: string;
  reference: string;
  echeance: string;
}

interface Trimestre {
  nom: string;
  mois: string[];
  totalDu: number;
  totalPaye: number;
  totalRestant: number;
}

export default function FinancesEleve() {
  // Date actuelle
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Détermination automatique de l'année scolaire
  const getDefaultAnneeScolaire = () => {
    if (currentMonth >= 8) { // Septembre (8) à Décembre
      return `${currentYear}-${currentYear + 1}`;
    } else if (currentMonth <= 5) { // Janvier à Juin
      return `${currentYear - 1}-${currentYear}`;
    } else { // Juillet et Août
      return `${currentYear}-${currentYear + 1}`;
    }
  };

  const [anneeScolaire, setAnneeScolaire] = useState(getDefaultAnneeScolaire());
  
  // Mois de l'année scolaire (Septembre à Juin)
  const moisScolaires = [
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
  ];

  // Définition des trimestres
  const trimestresDefinition: Trimestre[] = [
    {
      nom: "1er Trimestre",
      mois: ["Septembre", "Octobre", "Novembre"],
      totalDu: 0,
      totalPaye: 0,
      totalRestant: 0,
    },
    {
      nom: "2ème Trimestre",
      mois: ["Décembre", "Janvier", "Février"],
      totalDu: 0,
      totalPaye: 0,
      totalRestant: 0,
    },
    {
      nom: "3ème Trimestre",
      mois: ["Mars", "Avril", "Mai", "Juin"],
      totalDu: 0,
      totalPaye: 0,
      totalRestant: 0,
    },
  ];

  // États
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyUnpaid, setShowOnlyUnpaid] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [montantMensuel, setMontantMensuel] = useState(0);
  const [echeances, setEcheances] = useState<Date[]>([]);

  // Formattage monétaire
  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("fr-CD", {
      style: "currency",
      currency: "CDF",
      minimumFractionDigits: 0,
    }).format(amount);

  // Formattage date
  const formatDate = (date: Date) =>
    date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

  // Chargement des données
  useEffect(() => {
    const load = async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("Utilisateur non authentifié");
        
        // Chargement du profil utilisateur
        const uSnap = await getDoc(doc(firestore, "users", user.uid));
        if (!uSnap.exists()) throw new Error("Profil introuvable");
        const u = uSnap.data();
        if (u.role !== "élève") throw new Error("Accès réservé aux élèves");

        const { schoolId, classe } = u as { schoolId: string; classe: string };

        // Chargement des paramètres de paiement
        const settingsRef = collection(firestore, "schools", schoolId, "payements");
        const settingsQuery = query(settingsRef, where("class", "==", classe));
        const settingsSnap = await getDocs(settingsQuery);
        
        if (!settingsSnap.empty) {
          const settingsData = settingsSnap.docs[0].data();
          setMontantMensuel(Number(settingsData.monthlyAmount) || 0);
          
          // Calcul des échéances (5 de chaque mois)
          const echeancesCalc = moisScolaires.map((_, index) => {
            // Mois calendrier (0-11)
            const moisIndex = index < 4 ? index + 8 : index - 4;
            
            // Année : si mois est septembre-décembre (index 0-3) → currentYear
            //         si mois est janvier-juin (index 4-9) → currentYear + 1
            const anneeScolaireParts = anneeScolaire.split('-');
            const year = index < 4 ? parseInt(anneeScolaireParts[0]) : parseInt(anneeScolaireParts[1]);
            
            return new Date(year, moisIndex, 5); // 5 du mois
          });
          setEcheances(echeancesCalc);
        }

        // Chargement des paiements
        const ref = collection(firestore, "schools", schoolId, "payements");
        const q = query(
          ref,
          where("studentId", "==", user.uid),
          where("classe", "==", classe)
        );
        const snap = await getDocs(q);
        const list: Paiement[] = snap.docs.map((d) => {
          const data = d.data() as any;
          const date = data.date instanceof Date ? data.date : data.date.toDate?.();
          const mois = new Date(date).toLocaleString("fr-FR", { month: "long" });
          return {
            id: d.id,
            datePaiement: new Date(date).toLocaleDateString("fr-FR"),
            montant: data.amount,
            paye: data.amount,
            status: "Payé",
            mois: mois.charAt(0).toUpperCase() + mois.slice(1),
            modePaiement: data.method,
            reference: data.reference,
            echeance: "",
          };
        });
        setPaiements(list);
      } catch (err: any) {
        setError(err.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [anneeScolaire]);

  // Calcul des paiements répartis
  const paiementsRepartis = useMemo(() => {
    const totalPaye = paiements.reduce((sum, p) => sum + p.paye, 0);
    let remainingPaye = totalPaye;
    
    return moisScolaires.map((mois, index) => {
      const paiementExistant = paiements.find(p => p.mois === mois);
      let paye = 0;
      
      if (remainingPaye > 0) {
        paye = Math.min(montantMensuel, remainingPaye);
        remainingPaye -= paye;
      }
      
      // Détermination du statut
      let status = "Non échu";
      const echeanceDate = echeances[index];
      const aujourdHui = new Date();
      
      if (echeanceDate && aujourdHui > echeanceDate) {
        if (paye >= montantMensuel) {
          status = "Payé";
        } else if (paye > 0) {
          status = "Partiel";
        } else {
          status = "Impayé";
        }
      } else if (echeanceDate && aujourdHui.getMonth() === echeanceDate.getMonth() && 
                 aujourdHui.getFullYear() === echeanceDate.getFullYear()) {
        status = paye > 0 ? (paye >= montantMensuel ? "Payé" : "Partiel") : "En cours";
      }

      return {
        id: paiementExistant?.id || `virtual-${mois}`,
        mois,
        echeance: echeances[index] ? formatDate(echeances[index]) : "-",
        datePaiement: paiementExistant?.datePaiement || "-",
        montant: montantMensuel,
        paye,
        status,
        modePaiement: paiementExistant?.modePaiement || "-",
        reference: paiementExistant?.reference || "-",
      };
    });
  }, [paiements, montantMensuel, echeances]);

  // Calcul des totaux par trimestre
  const trimestresAvecTotaux = useMemo(() => {
    const trimestres = [...trimestresDefinition];
    
    paiementsRepartis.forEach(p => {
      trimestres.forEach(t => {
        if (t.mois.includes(p.mois)) {
          t.totalDu += p.montant;
          t.totalPaye += p.paye;
          t.totalRestant = t.totalDu - t.totalPaye;
        }
      });
    });
    
    return trimestres;
  }, [paiementsRepartis]);

  // Statistiques globales
  const totalDu = paiementsRepartis.reduce((sum, p) => sum + p.montant, 0);
  const totalPaye = paiementsRepartis.reduce((sum, p) => sum + p.paye, 0);
  const totalRestant = totalDu - totalPaye;
  const tauxPaye = totalDu ? (totalPaye / totalDu) * 100 : 0;

  // Filtrage
  const filtered = paiementsRepartis.filter((p) => {
    if (showOnlyUnpaid && (p.status === "Payé" || p.status === "Non échu")) return false;
    if (searchTerm && !p.mois.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Gestion du mode impression
  useEffect(() => {
    document.body.classList.toggle("print-mode", isPrintMode);
  }, [isPrintMode]);

  // Fonction pour les couleurs de statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Payé": return { bg: "bg-green-100", text: "text-green-800" };
      case "Partiel": return { bg: "bg-yellow-100", text: "text-yellow-800" };
      case "Impayé": return { bg: "bg-red-100", text: "text-red-800" };
      case "En cours": return { bg: "bg-blue-100", text: "text-blue-800" };
      default: return { bg: "bg-gray-100", text: "text-gray-800" };
    }
  };


  if (loading) return <div>Chargement des paiements…</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className={`container mx-auto p-4 ${isPrintMode ? "print-container" : ""}`}>
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mes paiements scolaires</h1>
          <p className="text-gray-600">Année {anneeScolaire}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex items-center bg-white border rounded-lg px-3 py-2 shadow-sm">
            <FiCalendar className="mr-2 text-gray-400" />
            <select
              className="bg-transparent focus:ring-0 border-none"
              value={anneeScolaire}
              onChange={(e) => setAnneeScolaire(e.target.value)}
            >
              <option value="2023-2024">2023-2024</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
            </select>
          </div>
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Rechercher mois…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
            />
            <FiFilter className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total dû", value: totalDu, color: "blue" },
          { label: "Total payé", value: totalPaye, color: "green" },
          { label: "Restant dû", value: totalRestant, color: "red" },
          { label: "Taux de paiement", value: tauxPaye, percent: true, color: "yellow" },
        ].map((s, i) => (
          <div
            key={i}
            className={`bg-white p-4 rounded-lg shadow border border-${s.color}-100`}
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-full bg-${s.color}-50 text-${s.color}-600 mr-3`}>
                <FiDollarSign size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-xl font-bold">
                  {s.percent ? `${Math.round(s.value as number)}%` : formatMoney(s.value as number)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totaux par trimestre */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {trimestresAvecTotaux.map((trimestre, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow border border-purple-100">
            <h3 className="font-semibold text-lg mb-2">{trimestre.nom}</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-sm text-gray-500">Dû</p>
                <p className="font-bold">{formatMoney(trimestre.totalDu)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Payé</p>
                <p className="font-bold text-green-600">{formatMoney(trimestre.totalPaye)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Restant</p>
                <p className="font-bold text-red-600">{formatMoney(trimestre.totalRestant)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Contrôles */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <h2 className="text-xl font-semibold">Détails des paiements</h2>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={showOnlyUnpaid}
              onChange={() => setShowOnlyUnpaid(!showOnlyUnpaid)}
              className="rounded text-blue-500"
            />
            Non payés seulement
          </label>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Mois",
                  "Échéance",
                  "Montant",
                  "Payé",
                  "Statut",
                  "Restant",
                ].map((th) => (
                  <th
                    key={th}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((p) => {
                const statusColor = getStatusColor(p.status);
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{p.mois}</td>
                    <td className="px-6 py-4">{p.echeance}</td>
                    <td className="px-6 py-4">{formatMoney(p.montant)}</td>
                    <td className="px-6 py-4">{p.paye > 0 ? formatMoney(p.paye) : "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${statusColor.bg} ${statusColor.text}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.status !== "Payé" && p.status !== "Non échu"
                        ? formatMoney(p.montant - p.paye)
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Styles impression */}
      <style jsx>{`
        @media print {
          body.print-mode * {
            visibility: hidden;
          }
          .print-container,
          .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            background: white;
          }
          .print-container table {
            width: 100%;
            font-size: 12px;
          }
          .print-container th, .print-container td {
            padding: 4px 8px;
          }
        }
      `}</style>
    </div>
  );
}
