// src/components/Bulletin.tsx
'use client';
import React, { useState } from 'react';
import SubjectRow from './SubjectRow';
import { sections } from '@/data/sections';

// Import des fonctions d'opérations
import {
  calculateTotals,
  calculateMaxTotals,
  calculatePercentages,
  computeSpecificPercentages,
} from '@/utils/operations1';

const Bulletin: React.FC = () => {
  // Calculer le nombre total de matières
  const totalSubjects = sections.reduce(
    (count, section) => count + section.subjects.length,
    0
  );
  
  // Pour chaque matière, on stocke 9 valeurs (6 saisies + 3 totaux calculés)
  const [allGrades, setAllGrades] = useState<number[][]>(
    Array(totalSubjects)
      .fill(0)
      .map(() => Array(9).fill(0))
  );

  const handleSubjectUpdate = (index: number, grades: number[]) => {
    const updatedGrades = [...allGrades];
    updatedGrades[index] = grades;
    setAllGrades(updatedGrades);
  };

  // Utilisation des fonctions importées
  const totals = calculateTotals(allGrades);
  const maxTotals = calculateMaxTotals(sections);
  const percentages = calculatePercentages(totals, maxTotals);
  const { examPercentage, totalSemesterPercentage, generalPercentage } =
    computeSpecificPercentages(totals, maxTotals);

  // Rendu des sections et de leurs matières
  const renderSections = () => {
    let globalSubjectIndex = 0;
    return sections.map(({ name, subjects, maxima }, sectionIndex) => (
      <React.Fragment key={sectionIndex}>
        {/* Ligne de la section */}
        <tr className="border px-2 py-1 font-bold bg-gray-100">
          <td className="border px-2 py-1 font-bold">{name}</td>
          {maxima.map((value, index) => (
            <td key={index} className="border px-2 py-1 text-center bg-gray-100">
              {value || ''}
            </td>
          ))}
          <td className="border px-2 py-1 text-center bg-gray-500"></td>
          <td className="border px-2 py-1 text-center bg-gray-500"></td>
        </tr>
        {subjects.map((subject) => {
          const currentIndex = globalSubjectIndex;
          globalSubjectIndex++;
          return (
            <SubjectRow
              key={currentIndex}
              subject={subject}
              maxValues={maxima}
              onUpdate={(grades) => handleSubjectUpdate(currentIndex, grades)}
            />
          );
        })}
      </React.Fragment>
    ));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-2xl p-6">
      <div className="grid grid-cols-[25%_50%_25%] items-center  pb-4 mb-4">
  {/* Première colonne : Drapeau (25%) */}
  <div className="flex justify-center">
    <img src="images/flag.png" alt="drapeau" className="w-24 h-16" />
  </div>

  {/* Deuxième colonne : Titre (50%) */}
  <div className="text-center">
    <h1 className="text-xl font-bold">RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</h1>
    <h2 className="text-lg">MINISTÈRE DE L’ENSEIGNEMENT PRIMAIRE SECONDAIRE</h2>
  </div>

 {/* Troisième colonne : Armoirie (25%) */}
  <div className="flex justify-center">
    <img src="images/armoiries.png" alt="armoirie" className="w-24 h-24" />
  </div>
</div>
<div className="border p-4  mx-auto">
       {/* Section pour l'école */}
        <div className="mb-4 items-center">
            <label className="font-bold pl-24 pr-2">N° ID.</label>
            {Array(27)
                .fill('')
                .map((_, i) => (
                  <span key={i} className="border border-black inline-block w-6 h-6"></span>
                ))}
        </div>
        
        {/* Section pour l'école */}
        <div className="border-t border-black py-2">
            <p className="font-bold">PROVINCE DE LOMAMI</p>
        </div>
        
        {/* Section pour les informations de l'élève */}
        <div className="grid grid-cols-2 border-t border-black py-2">
            <div>
                <p><span className="font-bold">VILLE :</span> MWENE-DITU</p>
                <p><span className="font-bold">COMMUNE :</span> BONDOYI</p>
                <p><span className="font-bold">ECOLE :</span> INSTITUT BONDOYI</p>
                <p><span className="font-bold">CODE :</span> 9006613</p>
            </div>
            <div>
                <p><span className="font-bold">ELEVE :</span> .................................... <span className="font-bold">SEXE :</span> ..........</p>
                <p><span className="font-bold">NE (E) A :</span> ..................... <span className="font-bold">LE</span> ....../....../..........</p>
                <p><span className="font-bold">CLASSEE :</span> .......................................</p>
                <p><span className="font-bold pr-2">N° PERM.</span> 
                {Array(11)
                .fill('')
                .map((_, i) => (
                  <span key={i} className="border  border-black inline-block w-6 h-6"></span>
                ))}
                </p>
            </div>
        </div>
        
       {/* Section pour les notes */}
        <div className="border-t border-black text-center py-2 font-bold">
            <p>BULLETIN DE LA 3<sup>ème</sup>, 4<sup>ème</sup> (1) ANNÉE MÉCANIQUE GÉNÉRALE</p>
            <p>ANNÉE SCOLAIRE 20......-20........</p>
        </div>
    </div>
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-2 py-1">Branches</th>
              <th colSpan={4} className="border px-2 py-1">
                Premier Semestre
              </th>
              <th colSpan={4} className="border px-2 py-1">
                Second Semestre
              </th>
              <th className="border px-2 py-1">Total Général</th>
              <th className="border px-2 py-1 pr-2 pl-2 text-gray-200">.........</th>
              <th className="border px-2 py-1">Examen de Repêchage</th>
            </tr>
            <tr className="bg-gray-200">
              <th className="border px-2 py-1"></th>
              <th className="border px-2 py-1">1er P</th>
              <th className="border px-2 py-1">2ème P</th>
              <th className="border px-2 py-1">Exam</th>
              <th className="border px-2 py-1">Total</th>
              <th className="border px-2 py-1">3ème P</th>
              <th className="border px-2 py-1">4ème P</th>
              <th className="border px-2 py-1">Exam</th>
              <th className="border px-2 py-1">Total</th>
              <th className="border px-2 py-1"></th>
              <th className="border px-2 py-1 pr-2"> % </th>
              <td className="border px-2 py-1 text-center">Sign. Prof</td>
            </tr>
          </thead>
          <tbody>
            {renderSections()}
            {/* Ligne résumé des MAXIMA généraux */}
            <tr className="border px-2 py-1 font-bold">
              <td className="border px-2 py-1 font-bold">MAXIMA GENERAUX</td>
              {maxTotals.map((max, i) => (
                <td key={i} className="border px-2 py-1 text-center bg-gray-300">
                  {max}
                </td>
              ))}
            </tr>
            {/* Ligne résumé des TOTAUX obtenus */}
            <tr className="border px-2 py-1 font-bold">
              <td className="border px-2 py-1 font-bold">TOTAUX</td>
              {totals.map((total, i) => (
                <td key={i} className="border px-2 py-1 text-center">
                  {total}
                </td>
              ))}
            </tr>
            {/* Ligne résumé des POURCENTAGES */}
            <tr className="border px-2 py-1 font-bold">
              <td className="border px-2 py-1 font-bold">POURCENTAGE</td>
              {percentages.map((perc, i) => (
                <td key={i} className="border px-2 py-1 text-center">
                  {perc} %
                </td>
              ))}
            </tr>
            {/* Ligne PLACE/NBRE ELEVES */}
            <tr className="border px-2 py-1 font-bold">
              <td className="border px-2 py-1 font-bold">PLACE/NBRE ELEVES</td>
              {Array(9)
                .fill('')
                .map((_, i) => (
                  <td key={i} className="border px-2 py-1 text-center"></td>
                ))}
            </tr>
          </tbody>
        </table>
        <div className="mt-4 text-sm">
          <p>- L’élève ne pourra passer dans la classe supérieure s’il n’a subi avec succès un examen de repêchage
          en……………………………………………………………………………………….(1) </p>
          <div className="grid grid-cols-2 ">
            <div>
            <p>- L’élève passe dans la classe supérieure (1)</p>
            <p>- L’élève double sa classe (1)</p>
            <p>- L’élève a échoué et est orienté vers............... (1)</p>
            </div>
            <div className="pt-6 pl-20">
            <p> Fait à ...................., le…………./………./20……</p>
            <p className="pt-10 font-bold pl-10 "> Le Chef d’Etablissement</p>
            </div>
          </div>
          <div className="flex justify-between py-10 px-14 font-bold">
            <p>Signature de l’élève</p>
            <p>Sceau de l’école </p>
            <p>Nom et Signature</p>
            </div>

          <div className="">
            <p className="">(1)Biffer la mention inutile</p>
            <p className="">Note importante : Le bulletin est sans valeur s’il est raturé ou surchargé</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bulletin;
