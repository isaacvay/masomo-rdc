"use client";
import React, { useState, useEffect } from "react";
import { firestore } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { sections } from "@/data/cours";
import BulletinHeader from "@/app/components/dashbordcomp/bulletin/BulletinHeader";
import BulletinFooter from "@/app/components/dashbordcomp/bulletin/BulletinFooter";
import { useRouter } from "next/router";
import QRCode from "react-qr-code";

/* ----------------- Interfaces ----------------- */

// Interface minimale pour une matière
interface Subject {
  name: string;
  // Tableau des valeurs maximales pour chaque note (6 indices)
  maxima: number[]; // ex: [max1, max2, max3, max4, max5, max6]
}

// Structure du bulletin tel qu'enregistré dans Firestore
interface Bulletin {
  id: string;
  Student: {
    displayName: string;
    sexe: string;
    neEA: string;
    naissance: string;
    classe: string;
    section: string;
    numPerm: string;
    
  };
  school: {
    province: string;
    ville: string;
    commune: string;
    nom: string;
    code: string;
  };
  // Tableau des matières utilisé pour l'affichage du tableau
  flattenedSubjects: Subject[];
  // Association entre le nom de la matière et un tableau de 6 notes (null si non renseigné)
  gradesMapping: Record<string, (number | null)[]>;
  // Totaux calculés
  totals: {
    sum1erP: number;
    sum2emeP: number;
    sumExam1: number;
    sumTotal1: number;
    sum3emeP: number;
    sum4emeP: number;
    sumExam2: number;
    sumTotal2: number;
    sumGeneral: number;
  };
  // Totaux maximums correspondants
  maxTotals: {
    sumMax1erP: number;
    sumMax2emeP: number;
    sumMaxExam1: number;
    sumMaxTotal1: number;
    sumMax3emeP: number;
    sumMax4emeP: number;
    sumMaxExam2: number;
    sumMaxTotal2: number;
    totalMaxGeneralDisplayed: number;
  };
  // Pourcentages (en string, ex : "75.0")
  percentages: {
    percent1erP: string;
    percent2emeP: string;
    percentExam1: string;
    percentTotal1: string;
    percent3emeP: string;
    percent4emeP: string;
    percentExam2: string;
    percentTotal2: string;
    percentGeneral: string;
  };
  // Optionnel : classement
  ranking?: {
    firstP: { rank: number; total: number };
    secondP: { rank: number; total: number };
    exam1: { rank: number; total: number };
    total1: { rank: number; total: number };
    thirdP: { rank: number; total: number };
    fourthP: { rank: number; total: number };
    exam2: { rank: number; total: number };
    total2: { rank: number; total: number };
    overall: { rank: number; total: number };
  };
  timestamp: any;
}

/* ----------------- Composant SubjectRowDisplay ----------------- */
// Composant en lecture seule reprenant la logique et le design de SubjectRow
const SubjectRowDisplay: React.FC<{
  subject: Subject;
  grades: (number | null)[];
}> = ({ subject, grades }) => {
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
      <td className={`border px-2 py-1 text-center font-bold ${grades.slice(3,6).every(g => g !== null) ? (secondSemTotal < secondSemMax / 2 ? "text-red-600" : "") : ""}`}>
        {grades.slice(3,6).every(g => g !== null) ? secondSemTotal : ""}
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

/* ----------------- Composant BulletinTableDisplay ----------------- */
// Ce composant reprend le design complet du tableau (en-têtes, lignes de matières, MAXIMA, TOTAUX, POURCENTAGE, etc.)
const BulletinTableDisplay: React.FC<{
  flattenedSubjects: Subject[];
  gradesMapping: Record<string, (number | null)[]>;
  totals: Bulletin["totals"];
  maxTotals: Bulletin["maxTotals"];
  percentages: Bulletin["percentages"];
  ranking?: Bulletin["ranking"];
}> = ({ flattenedSubjects = [], gradesMapping = {}, totals, maxTotals, percentages, ranking }) => {
  const renderEmptyCells = (count: number, additionalClasses = "") =>
    Array(count)
      .fill("")
      .map((_, i) => (
        <td key={i} className={`border px-2 py-1 text-center ${additionalClasses}`}></td>
      ));

  // Pour cet affichage, on considère que les totaux sont complets
  const completeFirstSem = true;
  const completeSecondSem = true;
  const completeGeneral = true;

  return (
    <table className="w-full border text-sm">
      <thead>
        <tr className="bg-gray-200">
          <th className="border px-2 py-1">Branches</th>
          <th className="border px-2 py-1"></th>
          <th colSpan={4} className="border px-2 py-1">Premier Semestre</th>
          <th className="border px-2 py-1"></th>
          <th colSpan={4} className="border px-2 py-1">Second Semestre</th>
          <th className="border px-2 py-1"></th>
          <th className="border px-2 py-1"></th>
          <th className="border px-2 py-1">Total Général</th>
          <th className="border px-2 py-1 pr-2 pl-2 text-gray-500 bg-gray-500 border-gray-500">......</th>
          <th className="border px-2 py-1 pr-2 pl-2 text-gray-200">.........</th>
          <th className="border px-2 py-1">Examen de Repêchage</th>
        </tr>
        <tr className="bg-gray-200">
          <th className="border px-2 py-1"></th>
          <th className="border px-2 py-1">Max</th>
          <th className="border px-2 py-1">1er P</th>
          <th className="border px-2 py-1">2ème P</th>
          <th className="border px-2 py-1">Max</th>
          <th className="border px-2 py-1">Exam</th>
          <th className="border px-2 py-1">Total</th>
          <th className="border px-2 py-1">Max</th>
          <th className="border px-2 py-1">3ème P</th>
          <th className="border px-2 py-1">4ème P</th>
          <th className="border px-2 py-1">Max</th>
          <th className="border px-2 py-1">Exam</th>
          <th className="border px-2 py-1">Total</th>
          <th className="border px-2 py-1"></th>
          <th className="border px-2 py-1 bg-gray-500 border-gray-500"></th>
          <th className="border px-2 py-1 pr-2"> % </th>
          <td className="border px-2 py-1 text-center">Sign. Prof</td>
        </tr>
      </thead>
      <tbody>
      {flattenedSubjects.map((subject, idx) => {
  const subjectGrades = gradesMapping[subject.name] || Array(6).fill(null);
  console.log("Rendu de la matière :", subject.name, subjectGrades);
  return <SubjectRowDisplay key={idx} subject={subject} grades={subjectGrades} />;
})}


        {/* Ligne MAXIMA GENERAUX */}
        <tr className="border px-2 py-1 font-bold">
          <td className="border px-2 py-1 font-bold">MAXIMA GENERAUX</td>
          <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300"></td>
          <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{maxTotals.sumMax1erP}</td>
          <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{maxTotals.sumMax2emeP}</td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{maxTotals.sumMaxExam1}</td>
          <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{maxTotals.sumMaxTotal1}</td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{maxTotals.sumMax3emeP}</td>
          <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{maxTotals.sumMax4emeP}</td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{maxTotals.sumMaxExam2}</td>
          <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{maxTotals.sumMaxTotal2}</td>
          <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{maxTotals.totalMaxGeneralDisplayed}</td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"> </td>
        </tr>
        {/* Ligne TOTAUX */}
        <tr className="border px-2 py-1 font-bold">
          <td className="border px-2 py-1 font-bold">TOTAUX</td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center">{totals.sum1erP}</td>
          <td className="border px-2 py-1 text-center">{totals.sum2emeP}</td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center">{totals.sumExam1}</td>
          <td className="border px-2 py-1 text-center">{completeFirstSem ? totals.sumTotal1 : ""}</td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center">{totals.sum3emeP}</td>
          <td className="border px-2 py-1 text-center">{totals.sum4emeP}</td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center">{totals.sumExam2}</td>
          <td className="border px-2 py-1 text-center">{completeSecondSem ? totals.sumTotal2 : ""}</td>
          <td className="border px-2 py-1 text-center">{completeGeneral ? totals.sumGeneral : ""}</td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center"></td>
        </tr>
        {/* Ligne POURCENTAGE */}
        <tr className="border px-2 py-1 font-bold">
          <td className="border px-2 py-1 font-bold">POURCENTAGE</td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center">
            {totals.sum1erP ? percentages.percent1erP : ""}%
          </td>
          <td className="border px-2 py-1 text-center">
            {totals.sum2emeP ? percentages.percent2emeP : ""}%
          </td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center">
            {totals.sumExam1 ? percentages.percentExam1 : ""}%
          </td>
          <td className="border px-2 py-1 text-center">
            {completeFirstSem ? percentages.percentTotal1 : ""}%
          </td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center">
            {totals.sum3emeP ? percentages.percent3emeP : ""}%
          </td>
          <td className="border px-2 py-1 text-center">
            {totals.sum4emeP ? percentages.percent4emeP : ""}%
          </td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center">
            {totals.sumExam2 ? percentages.percentExam2 : ""}%
          </td>
          <td className="border px-2 py-1 text-center">
            {completeSecondSem ? percentages.percentTotal2 : ""}%
          </td>
          <td className="border px-2 py-1 text-center">
            {completeGeneral ? percentages.percentGeneral : ""}%
          </td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center"></td>
        </tr>
        {/* Ligne CLASSEMENT (si défini) */}
        {ranking && (
          <tr className="border px-2 py-1 font-bold">
            <td className="border px-2 py-1 font-bold">PLACE/NBRE ÉLÈVES</td>
            <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
            <td className="border px-2 py-1 text-center">
              {percentages.percent1erP ? `${ranking.firstP.rank} / ${ranking.firstP.total}` : ""}
            </td>
            <td className="border px-2 py-1 text-center">
              {percentages.percent2emeP ? `${ranking.secondP.rank} / ${ranking.secondP.total}` : ""}
            </td>
            <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
            <td className="border px-2 py-1 text-center">
              {percentages.percentExam1 ? `${ranking.exam1.rank} / ${ranking.exam1.total}` : ""}
            </td>
            <td className="border px-2 py-1 text-center">
              {completeFirstSem ? `${ranking.total1.rank} / ${ranking.total1.total}` : ""}
            </td>
            <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
            <td className="border px-2 py-1 text-center">
              {percentages.percent3emeP ? `${ranking.thirdP.rank} / ${ranking.thirdP.total}` : ""}
            </td>
            <td className="border px-2 py-1 text-center">
              {percentages.percent4emeP ? `${ranking.fourthP.rank} / ${ranking.fourthP.total}` : ""}
            </td>
            <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
            <td className="border px-2 py-1 text-center">
              {percentages.percentExam2 ? `${ranking.exam2.rank} / ${ranking.exam2.total}` : ""}
            </td>
            <td className="border px-2 py-1 text-center">
              {completeSecondSem ? `${ranking.total2.rank} / ${ranking.total2.total}` : ""}
            </td>
            <td className="border px-2 py-1 text-center">
              {completeGeneral ? `${ranking.overall.rank} / ${ranking.overall.total}` : ""}
            </td>
            <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
            <td className="border px-2 py-1 text-center"></td>
            <td className="border px-2 py-1 text-center"></td>
          </tr>
        )}
        {/* Lignes APPLICATION et CONDUITE */}
        <tr className="border px-2 py-1 font-bold">
          <td className="border px-2 py-1 font-bold">APPLICATION</td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          {renderEmptyCells(2)}
          {renderEmptyCells(4, "bg-gray-500 border-gray-500")}
          {renderEmptyCells(2)}
          {renderEmptyCells(5, "bg-gray-500 border-gray-500")}
        </tr>
        <tr className="border px-2 py-1 font-bold">
          <td className="border px-2 py-1 font-bold">CONDUITE</td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          {renderEmptyCells(2)}
          {renderEmptyCells(4, "bg-gray-500 border-gray-500")}
          {renderEmptyCells(2)}
          {renderEmptyCells(5, "bg-gray-500 border-gray-500")}
        </tr>
      </tbody>
    </table>
  );
};

/* ----------------- Composant BulletinHeaderDisplay ----------------- */
const BulletinHeaderDisplay: React.FC<{
  student: Bulletin["Student"];
  school: Bulletin["school"];
  timestamp: Bulletin["timestamp"];
}> = ({ student, school, timestamp }) => {
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };  
  // Calcul de l'année scolaire
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0 = janvier, 9 = octobre

  const [startYear, endYear] = currentMonth >= 9 
    ? [currentYear, currentYear + 1]
    : [currentYear - 1, currentYear];

  return (
    <div className="border p-4 mx-auto uppercase">
      {/* Identification */}
      <div className="mb-4 items-center">
        <label className="font-bold pl-24 pr-2">N° ID.</label>
        {Array(27).fill("").map((_, i) => (
          <span key={i} className="border border-black inline-block w-6 h-6"></span>
        ))}
      </div>

      {/* Informations sur l'école */}
      <div className="border-t border-black py-2">
        <p className="font-bold">Province: {school?.province || "Province de l'école"}</p>
      </div>

      {/* Infos élève et école */}
      <div className="grid grid-cols-2 border-t border-black py-2">
        <div>
          <p><span className="font-bold">VILLE :</span> {school?.ville || "Ville"}</p>
          <p><span className="font-bold">COMMUNE :</span> {school?.commune || "Commune"}</p>
          <p><span className="font-bold">ECOLE :</span> {school?.nom || "Nom de l'école"}</p>
          <p><span className="font-bold">CODE :</span> {school?.code || "Code"}</p>
        </div>
        <div className="grid grid-cols-2">
          <div>
          <p className="font-bold uppercase">
            <span className="font-medium">ELEVE :</span> {student.displayName} 
          </p>
          <p className="font-bold uppercase">
            <span className="font-medium">NE (E) A :</span> {student.neEA} 
          </p>
          <p className="font-bold">
            <span className="font-medium">CLASSE :</span> {student.classe}
          </p>
          <p className="font-bold">
            <span className="font-medium pr-2">N° PERM :</span> {student.numPerm}
          </p>
          </div>
          <div>
          <p className="font-bold uppercase">
            <span className="font-medium ">SEXE :</span> {student.sexe}
          </p>
          <p className="font-bold uppercase">
            <span className="font-medium ">LE :</span> {formatDate(student.naissance)}
          </p>
          </div>
          
        </div>
      </div>

      {/* Titre du bulletin */}
      <div className="border-t border-black text-center py-2 font-bold">
        <p>
          BULLETIN DE LA {student.classe} ANNÉE {student.section} {" "}
          ANNÉE SCOLAIRE {startYear}-{endYear}
        </p>
      </div>
    </div>
  );
};
/* ----------------- Composant BulletinDisplay ----------------- */
const BulletinDisplay = ({ bulletin }: { bulletin: Bulletin }) => (
  <div className="max-w-6xl mx-auto  bg-white rounded-xl shadow-2xl p-4 sm:p-6 md:p-8">
     <BulletinHeader/>
    <BulletinHeaderDisplay
      student={bulletin.Student}
      school={bulletin.school}
      timestamp={bulletin.timestamp}
    />
    <div className="overflow-x-auto">
      <BulletinTableDisplay
        flattenedSubjects={bulletin.flattenedSubjects || []}
        gradesMapping={bulletin.gradesMapping || {}}
        totals={bulletin.totals}
        maxTotals={bulletin.maxTotals}
        percentages={bulletin.percentages}
        ranking={bulletin.ranking}
      />
    </div>
    <BulletinFooter/>
    // Dans BulletinDisplay.tsx
   <div className="flex flex-col items-center mt-8">
  <QRCode 
    value={`https://masomo-rdc.vercel.app/pages/verification-bulletin?bulletinId=${bulletin.id}`}
    size={60} 
  />
  <div className="mt-4 text-center">
    Code de vérification : <strong>{bulletin.id}</strong>
  </div>
</div>
  </div>
);

/* ----------------- Icônes ----------------- */
const QrCodeIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z"
    />
  </svg>
);

const ExclamationTriangleIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
    />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

/* ----------------- Composant principal VerificateurBulletin ----------------- */
export default function VerificateurBulletin() {
  const [code, setCode] = useState("");
  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const fetchBulletin = async (bulletinId: string) => {
    setError("");
    setBulletin(null);
    try {
      const bulletinDocRef = doc(firestore, "publicBulletins", bulletinId);
      const bulletinDocSnap = await getDoc(bulletinDocRef);
      
      if (bulletinDocSnap.exists()) {
        const data = bulletinDocSnap.data();
    
        console.log("Données Firestore :", data);
        
        // Vérification et transformation des données si nécessaire
        let flattenedSubjects: Subject[] = data.flattenedSubjects;
        if (!flattenedSubjects || flattenedSubjects.length === 0) {
          // Création d'un nouveau tableau temporaire pour éviter la redéclaration
          const newFlattenedSubjects = Object.keys(data.grades).map(subjectName => {
            const coursSubjects = sections.flatMap(section => section.subjects);
            const coursSubject = coursSubjects.find(subject => subject.name === subjectName);
            
  
            return {
              name: subjectName,
              maxima: [
                coursSubject?.maxima[0] ?? 0,
                coursSubject?.maxima[1] ?? 0,
                coursSubject?.maxima[2] ?? 0,
                coursSubject?.maxima[4] ?? 0,
                coursSubject?.maxima[4] ?? 0,
                coursSubject?.maxima[6] ?? 0,
                coursSubject?.maxima[6] ?? 0,
                coursSubject?.maxima[7] ?? 0,
              ],
            };
          });
  
          flattenedSubjects = newFlattenedSubjects;
        }
        
  
        let gradesMapping: Record<string, (number | null)[]> = data.gradesMapping;
        if (!gradesMapping || Object.keys(gradesMapping).length === 0) {
          gradesMapping = data.grades;
        }
  
        const bulletinData: Bulletin = {
          id: bulletinDocSnap.id,
          Student: data.student || { displayName: "", sexe: "", neEA: "", naissance: "", classe: "", section: "", numPerm: "" },
          school: data.school || { province: "", ville: "", commune: "", nom: "", code: "" },
          flattenedSubjects,
          gradesMapping,
          totals: data.totals || {
            sum1erP: 0, sum2emeP: 0, sumExam1: 0, sumTotal1: 0,
            sum3emeP: 0, sum4emeP: 0, sumExam2: 0, sumTotal2: 0,
            sumGeneral: 0,
          },
          maxTotals: data.maxTotals || {
            sumMax1erP: 0, sumMax2emeP: 0, sumMaxExam1: 0, sumMaxTotal1: 0,
            sumMax3emeP: 0, sumMax4emeP: 0, sumMaxExam2: 0, sumMaxTotal2: 0,
            totalMaxGeneralDisplayed: 0,
          },
          percentages: data.percentages || {
            percent1erP: "0", percent2emeP: "0", percentExam1: "0", percentTotal1: "0",
            percent3emeP: "0", percent4emeP: "0", percentExam2: "0", percentTotal2: "0",
            percentGeneral: "0",
          },
          timestamp: data.timestamp || new Date(),
        };
  
        setBulletin(bulletinData);
      } else {
        setError("Code invalide - Bulletin non reconnu");
      }
    } catch (err) {
      console.error("Erreur lors de la récupération du bulletin :", err);
      setError("Erreur lors de la récupération du bulletin");
    }
  };
  
  
  

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchBulletin(code);
  };

  const VerificateurBulletin = () => {
    const router = useRouter();
    const { bulletinId } = router.query;
  
    useEffect(() => {
      if (bulletinId) {
        setCode(bulletinId as string);
        fetchBulletin(bulletinId as string); // Auto-vérification
      }
    }, [bulletinId]);
  }

const simulateScan = () => {
  setIsScanning(true);
  setTimeout(() => {
    if (bulletin) {
      setCode(bulletin.id); // Utilise l'ID du bulletin chargé
    } else {
      setCode("KIN2023-456"); // Valeur par défaut pour les tests
    }
    setIsScanning(false);
  }, 1500);
};

  useEffect(() => {
    if (code.length === 0) setError("");
  }, [code]);

  return (
    <div className="min-h-[70vh] bg-gradient-to-br mt-20 from-blue-50 to-yellow-50 flex items-start justify-center p-8">
      <div className="w-full max-w-7xl  bg-white rounded-2xl shadow-xl">
        <header className="p-8 bg-blue-600 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-lg">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Flag_of_the_Democratic_Republic_of_the_Congo.svg/1200px-Flag_of_the_Democratic_Republic_of_the_Congo.svg.png"
                alt="Drapeau RDC"
                className="h-12 w-16 object-cover"
              />
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">
                SYSTÈME NATIONAL DE VÉRIFICATION DES BULLETINS
              </h1>
              <p className="text-sm">
                Ministère de l'Enseignement Primaire, Secondaire et Technique
              </p>
            </div>
          </div>
        </header>
        <main className="p-8">
          <form onSubmit={handleFormSubmit} className="mb-8">
            <div className="bg-blue-50 p-6 rounded-xl">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Entrez le BulletinId"
                    className="w-full px-6 py-4 pl-12 text-lg border-2 border-blue-200/50 hover:border-blue-300 focus:border-blue-500 rounded-xl focus:ring-4 focus:ring-blue-100/50 placeholder:text-blue-400/70 transition-all duration-200 bg-white/90 shadow-sm hover:shadow-md focus:shadow-lg"
                    autoComplete="off"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                    {code && (
                      <button
                        type="button"
                        onClick={() => setCode("")}
                        className="p-1 text-blue-400 hover:text-blue-600 transition-colors"
                        aria-label="Effacer"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={simulateScan}
                      disabled={isScanning}
                      className={`p-2 rounded-lg ${
                        isScanning
                          ? "text-blue-400 cursor-wait"
                          : "text-blue-600 hover:bg-blue-50"
                      } transition-colors`}
                    >
                      {isScanning ? (
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <QrCodeIcon className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-8 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                  <CheckIcon className="w-6 h-6" />
                  Vérifier
                </button>
              </div>
              {error && (
                <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-center gap-3 animate-fade-in">
                  <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Erreur de vérification</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </form>
          {bulletin && <BulletinDisplay bulletin={bulletin} />}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>
              Système officiel de vérification - Toute falsification est passible de
              poursuites judiciaires
            </p>
            <p className="mt-2">
              © Ministère de l'EPST - RDC {new Date().getFullYear()}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
