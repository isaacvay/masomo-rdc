"use client";
import React from 'react';

export interface Bulletin {
  id: number;
  code: string;
  eleve: string;
  classe: string;
  ecole: string;
  annee: string;
  matieres: { nom: string; coefficient: number; note: number }[];
}

const CheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

export const BulletinDisplay = ({ bulletin }: { bulletin: Bulletin }) => {
  const moyenneGenerale = bulletin.matieres
    .reduce((acc, matiere) => acc + (matiere.note * matiere.coefficient), 0) 
    / bulletin.matieres.reduce((acc, matiere) => acc + matiere.coefficient, 0);

  return (
    <div className="mt-8 bg-white rounded-xl shadow-lg border border-blue-100">
      <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-xl">
        <div className="flex justify-between items-center text-white">
          <div>
            <h2 className="text-2xl font-bold">RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</h2>
            <p className="text-sm">Ministère de l'Enseignement Primaire, Secondaire et Technique</p>
          </div>
          <div className="text-right">
            <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center">
              <CheckIcon className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div>
            <p className="font-semibold text-blue-900">Élève:</p>
            <p>{bulletin.eleve}</p>
          </div>
          <div>
            <p className="font-semibold text-blue-900">École:</p>
            <p>{bulletin.ecole}</p>
          </div>
          <div>
            <p className="font-semibold text-blue-900">Année Scolaire:</p>
            <p>{bulletin.annee}</p>
          </div>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-50">
              <th className="p-3 text-left border border-blue-200">Matière</th>
              <th className="p-3 border border-blue-200">Coefficient</th>
              <th className="p-3 border border-blue-200">Note</th>
            </tr>
          </thead>
          <tbody>
            {bulletin.matieres.map((matiere, index) => (
              <tr key={index} className="hover:bg-gray-50 even:bg-gray-50">
                <td className="p-3 border border-blue-200">{matiere.nom}</td>
                <td className="p-3 text-center border border-blue-200">{matiere.coefficient}</td>
                <td className="p-3 text-center border border-blue-200 font-semibold">{matiere.note}/100</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end items-center gap-8">
          <div className="text-right">
            <p className="text-sm text-gray-600">Moyenne Générale:</p>
            <p className="text-3xl font-bold text-blue-600">{moyenneGenerale.toFixed(2)}/100</p>
          </div>
          <div className="h-20 w-20 bg-blue-100 rounded-lg flex items-center justify-center">
            <CheckIcon className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-dashed border-blue-200">
          <div className="flex justify-between">
            <div className="text-center">
              <p className="font-semibold text-blue-900">Le Directeur</p>
              <div className="mt-2 h-20 w-32 border-b-2 border-blue-600"></div>
            </div>
            <div className="text-center">
              <p className="font-semibold text-blue-900">Le Chef des Travaux</p>
              <div className="mt-2 h-20 w-32 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};