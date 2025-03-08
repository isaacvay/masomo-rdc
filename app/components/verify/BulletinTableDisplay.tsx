// components/Bulletin/BulletinTableDisplay.tsx
"use client";
import React from "react";
import SubjectRowDisplay from "./SubjectRowDisplay";
import { Bulletin } from "./BulletinTypes";

interface BulletinTableDisplayProps {
  flattenedSubjects: Bulletin["flattenedSubjects"];
  gradesMapping: Bulletin["gradesMapping"];
  totals: Bulletin["totals"];
  maxTotals: Bulletin["maxTotals"];
  percentages: Bulletin["percentages"];
  ranking?: Bulletin["ranking"];
}

const BulletinTableDisplay: React.FC<BulletinTableDisplayProps> = ({
  flattenedSubjects = [],
  gradesMapping = {},
  totals,
  maxTotals,
  percentages,
  ranking,
}) => {
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

export default BulletinTableDisplay;
