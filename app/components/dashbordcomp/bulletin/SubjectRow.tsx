"use client";
import React, { useState, useEffect, useRef } from "react";
import { Subject } from "@/data/cours";

export interface SubjectRowProps {
  subject: Subject;
  initialGrades?: number[];
  onUpdate?: (grades: number[]) => void;
}

// Fonction helper pour comparer deux tableaux de nombres
const arraysAreEqual = (a: (number | null)[], b: (number | null)[]) => {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
};

const SubjectRow: React.FC<SubjectRowProps> = ({ subject, initialGrades, onUpdate }) => {
  // On initialise les notes avec null pour représenter l'absence de note
  const [grades, setGrades] = useState<(number | null)[]>(
    initialGrades ? initialGrades.map(x => (x === 0 ? null : x)) : Array(6).fill(null)
  );

  // Stocker la dernière valeur de grades pour comparer
  const prevGradesRef = useRef<(number | null)[]>(grades);

  useEffect(() => {
    if (initialGrades) {
      const mapped = initialGrades.map(x => (x === 0 ? null : x));
      setGrades(mapped);
      prevGradesRef.current = mapped;
    }
  }, [initialGrades]);

  // Dès que les notes changent, on informe le parent via le callback onUpdate, uniquement si la valeur a réellement changé
  useEffect(() => {
    if (onUpdate && !arraysAreEqual(prevGradesRef.current, grades)) {
      onUpdate(grades.map(g => (g === null ? 0 : g)));
      prevGradesRef.current = grades;
    }
  }, [grades, onUpdate]);

  // Retourne le maximum autorisé pour chaque indice
  const getMaxAllowed = (index: number): number => {
    switch (index) {
      case 0:
        return subject.maxima[0];
      case 1:
        return subject.maxima[1];
      case 2:
        return subject.maxima[2];
      case 3:
        return subject.maxima[4];
      case 4:
        return subject.maxima[5];
      case 5:
        return subject.maxima[6];
      default:
        return 0;
    }
  };

  // Détermine la classe CSS pour l'affichage d'une note
  const getDisplayClass = (index: number): string => {
    const maxAllowed = getMaxAllowed(index);
    const currentGrade = grades[index];
    if (currentGrade === null) return "";
    return maxAllowed > 0 && currentGrade < maxAllowed / 2 ? "text-red-600" : "";
  };

  // Calcul des totaux par semestre et global
  const firstSemTotal = (grades[0] ?? 0) + (grades[1] ?? 0) + (grades[2] ?? 0);
  const secondSemTotal = (grades[3] ?? 0) + (grades[4] ?? 0) + (grades[5] ?? 0);
  const generalTotal = firstSemTotal + secondSemTotal;

  // Calcul des maximums totaux
  const firstSemMax = (subject.maxima[0] || 0) + (subject.maxima[1] || 0) + (subject.maxima[2] || 0);
  const secondSemMax = (subject.maxima[4] || 0) + (subject.maxima[5] || 0) + (subject.maxima[6] || 0);
  const overallMax = firstSemMax + secondSemMax;

  return (
    <tr>
      {/* Nom du cours */}
      <td className="border px-2 py-1 font-semibold">{subject.name}</td>
      
      {/* Premier semestre */}
      <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">
        {subject.maxima[0]}
      </td>
      <td className={`border px-2 py-1 text-center font-semibold ${getDisplayClass(0)}`}>
        {grades[0] !== null ? grades[0] : ""}
      </td>
      <td className={`border px-2 py-1 text-center font-semibold ${getDisplayClass(1)}`}>
        {grades[1] !== null ? grades[1] : ""}
      </td>
      <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">
        {subject.maxima[2]}
      </td>
      <td className={`border px-2 py-1 text-center font-semibold ${getDisplayClass(2)}`}>
        {grades[2] !== null ? grades[2] : ""}
      </td>
      <td className={`border px-2 py-1 text-center font-bold ${firstSemTotal < firstSemMax / 2 ? "text-red-600" : ""}`}>
        {firstSemTotal !== 0 ? firstSemTotal : ""}
      </td>
      
      {/* Second semestre */}
      <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">
        {subject.maxima[4]}
      </td>
      <td className={`border px-2 py-1 text-center font-semibold ${getDisplayClass(3)}`}>
        {grades[3] !== null ? grades[3] : ""}
      </td>
      <td className={`border px-2 py-1 text-center font-semibold ${getDisplayClass(4)}`}>
        {grades[4] !== null ? grades[4] : ""}
      </td>
      <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">
        {subject.maxima[6]}
      </td>
      <td className={`border px-2 py-1 text-center font-semibold ${getDisplayClass(5)}`}>
        {grades[5] !== null ? grades[5] : ""}
      </td>
      <td className={`border px-2 py-1 text-center font-bold ${secondSemTotal < secondSemMax / 2 ? "text-red-600" : ""}`}>
        {secondSemTotal !== 0 ? secondSemTotal : ""}
      </td>
      
      <td className={`border px-2 py-1 text-center font-bold ${generalTotal < overallMax / 2 ? "text-red-600" : ""}`}>
        {generalTotal !== 0 ? generalTotal : ""}
      </td>
      
      <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
      <td className="border px-2 py-1 text-center"></td>
      <td className="border px-2 py-1 text-center"></td>
    </tr>
  );
};

export default SubjectRow;
