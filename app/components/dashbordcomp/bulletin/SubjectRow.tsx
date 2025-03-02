"use client";
import React, { useState, useEffect, useRef } from "react";
import { Subject } from "@/data/cours";

export interface SubjectRowProps {
  subject: Subject;
  initialGrades?: number[];
  onUpdate?: (grades: number[]) => void;
}

const arraysAreEqual = (a: (number | null)[], b: (number | null)[]) => {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
};

const SubjectRow: React.FC<SubjectRowProps> = ({ subject, initialGrades, onUpdate }) => {
  const [grades, setGrades] = useState<(number | null)[]>(
    initialGrades ? initialGrades.map(x => (x === 0 ? null : x)) : Array(6).fill(null)
  );

  const prevGradesRef = useRef<(number | null)[]>(grades);

  useEffect(() => {
    if (initialGrades) {
      const mapped = initialGrades.map(x => (x === 0 ? null : x));
      setGrades(mapped);
      prevGradesRef.current = mapped;
    }
  }, [initialGrades]);

  useEffect(() => {
    if (onUpdate && !arraysAreEqual(prevGradesRef.current, grades)) {
      onUpdate(grades.map(g => (g === null ? 0 : g)));
      prevGradesRef.current = grades;
    }
  }, [grades, onUpdate]);

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

  const getDisplayClass = (index: number): string => {
    const maxAllowed = getMaxAllowed(index);
    const currentGrade = grades[index];
    if (currentGrade === null) return "";
    return maxAllowed > 0 && currentGrade < maxAllowed / 2 ? "text-red-600" : "";
  };

  const firstSemTotal = (grades[0] ?? 0) + (grades[1] ?? 0) + (grades[2] ?? 0);
  const secondSemTotal = (grades[3] ?? 0) + (grades[4] ?? 0) + (grades[5] ?? 0);
  const generalTotal = firstSemTotal + secondSemTotal;

  const firstSemMax = (subject.maxima[0] || 0) + (subject.maxima[1] || 0) + (subject.maxima[2] || 0);
  const secondSemMax = (subject.maxima[4] || 0) + (subject.maxima[5] || 0) + (subject.maxima[6] || 0);
  const overallMax = firstSemMax + secondSemMax;

  return (
    <tr>
      <td className="border px-2 py-1 font-semibold">{subject.name}</td>
      
      <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{subject.maxima[0]}</td>
      <td className={`border px-2 py-1 text-center font-semibold ${getDisplayClass(0)}`}>{grades[0] ?? ""}</td>
      <td className={`border px-2 py-1 text-center font-semibold ${getDisplayClass(1)}`}>{grades[1] ?? ""}</td>
      <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{subject.maxima[2]}</td>
      <td className={`border px-2 py-1 text-center font-semibold ${getDisplayClass(2)}`}>{grades[2] ?? ""}</td>
      <td className={`border px-2 py-1 text-center font-bold ${grades.slice(0,3).every(g => g !== null) ? (firstSemTotal < firstSemMax / 2 ? "text-red-600" : "") : ""}`}>
        {grades.slice(0,3).every(g => g !== null) ? firstSemTotal : ""}
      </td>
      
      <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{subject.maxima[4]}</td>
      <td className={`border px-2 py-1 text-center font-semibold ${getDisplayClass(3)}`}>{grades[3] ?? ""}</td>
      <td className={`border px-2 py-1 text-center font-semibold ${getDisplayClass(4)}`}>{grades[4] ?? ""}</td>
      <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{subject.maxima[6]}</td>
      <td className={`border px-2 py-1 text-center font-semibold ${getDisplayClass(5)}`}>{grades[5] ?? ""}</td>
      <td className={`border px-2 py-1 text-center font-bold ${grades.slice(3,6).every(g => g !== null) ? (secondSemTotal < secondSemMax / 2 ? "text-red-600" : "") : ""}`}>
        {grades.slice(3,6).every(g => g !== null) ? secondSemTotal : ""}
      </td>
      
      <td className={`border px-2 py-1 text-center font-bold ${grades.every(g => g !== null) ? (generalTotal < overallMax / 2 ? "text-red-600" : "") : ""}`}>
        {grades.every(g => g !== null) ? generalTotal : ""}
      </td>
      
      <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
      <td className="border px-2 py-1 text-center"></td>
      <td className="border px-2 py-1 text-center"></td>
    </tr>
  );
};

export default SubjectRow;


