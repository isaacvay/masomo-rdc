// components/Bulletin/SubjectRowDisplay.tsx
"use client";
import React from "react";
import { Subject } from "./BulletinTypes";

interface SubjectRowDisplayProps {
  subject: Subject;
  grades: (number | null)[];
}

const SubjectRowDisplay: React.FC<SubjectRowDisplayProps> = ({ subject, grades }) => {
  const getMaxAllowed = (index: number): number => subject.maxima[index] || 0;
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
  const secondSemMax = (subject.maxima[3] || 0) + (subject.maxima[4] || 0) + (subject.maxima[5] || 0);
  const overallMax = firstSemMax + secondSemMax;

  return (
    <tr>
      <td className="border px-2 py-1 font-semibold">{subject.name}</td>
      {/* Premier Semestre */}
      <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{subject.maxima[0]}</td>
      <td className={`border px-2 py-1 text-center font-semibold ${getDisplayClass(0)}`}>
        {grades[0] !== null ? grades[0] : ""}
      </td>
      <td className={`border px-2 py-1 text-center font-semibold ${getDisplayClass(1)}`}>
        {grades[1] !== null ? grades[1] : ""}
      </td>
      <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{subject.maxima[2]}</td>
      <td className={`border px-2 py-1 text-center font-semibold ${getDisplayClass(2)}`}>
        {grades[2] !== null ? grades[2] : ""}
      </td>
      <td className={`border px-2 py-1 text-center font-bold ${
        grades.slice(0, 3).every(g => g !== null)
          ? (firstSemTotal < firstSemMax / 2 ? "text-red-600" : "")
          : ""
      }`}>
        {grades.slice(0, 3).every(g => g !== null) ? firstSemTotal : ""}
      </td>
      {/* Second Semestre */}
      <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{subject.maxima[3]}</td>
      <td className={`border px-2 py-1 text-center font-semibold ${getDisplayClass(3)}`}>
        {grades[3] !== null ? grades[3] : ""}
      </td>
      <td className={`border px-2 py-1 text-center font-semibold ${getDisplayClass(4)}`}>
        {grades[4] !== null ? grades[4] : ""}
      </td>
      <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{subject.maxima[5]}</td>
      <td className={`border px-2 py-1 text-center font-semibold ${getDisplayClass(5)}`}>
        {grades[5] !== null ? grades[5] : ""}
      </td>
      <td className={`border px-2 py-1 text-center font-bold ${
        grades.slice(3, 6).every(g => g !== null) ? (secondSemTotal < secondSemMax / 2 ? "text-red-600" : "") : ""
      }`}>
        {grades.slice(3, 6).every(g => g !== null) ? secondSemTotal : ""}
      </td>
      
      <td className={`border px-2 py-1 text-center font-bold ${
        grades && grades.every(g => g !== null)
          ? (generalTotal < overallMax / 2 ? "text-red-600" : "")
          : ""
      }`}>
        {grades && grades.every(g => g !== null) ? generalTotal : ""}
      </td>

      {/* Cellules supplémentaires pour respecter le design */}
      <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
      <td className="border px-2 py-1 text-center"></td>
      <td className="border px-2 py-1 text-center"></td>
    </tr>
  );
};

export default SubjectRowDisplay;
