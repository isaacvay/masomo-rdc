"use client";
import React from 'react';
import SubjectRow from './SubjectRow';
import { Totals, MaxTotals } from '@/utils/operations';
import { Subject } from '@/data/cours';

export interface Rankings {
  firstP: { rank: number; total: number };
  secondP: { rank: number; total: number };
  exam1: { rank: number; total: number };
  total1: { rank: number; total: number };
  thirdP: { rank: number; total: number };
  fourthP: { rank: number; total: number };
  exam2: { rank: number; total: number };
  total2: { rank: number; total: number };
  overall: { rank: number; total: number };
}

export interface BulletinTableProps {
  flattenedSubjects: Subject[];
  handleSubjectUpdate: (index: number, grades: (number | null)[]) => void;
  totals: Totals;
  maxTotals: MaxTotals;
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
  initialGradesMapping?: Record<string, (number | null)[]>;
  ranking?: Rankings;
  // Chaque ligne correspond à un SubjectRow (tableau de 6 notes)
  gradesMatrix: (number | null)[][];
};

/**
 * Vérifie qu'au moins une note existe dans la colonne spécifiée.
 * Pour les colonnes individuelles, on se base sur la présence d'une valeur (même 0 peut être considérée comme renseignée si ce n'est pas null).
 */
const hasAnyForColumn = (gradesMatrix: (number | null)[][], col: number): boolean =>
  gradesMatrix.some(row => row[col] !== null);

/**
 * Vérifie qu'au moins une note existe dans l'une des colonnes spécifiées.
 */
const hasAnyForColumns = (gradesMatrix: (number | null)[][], cols: number[]): boolean =>
  gradesMatrix.some(row => cols.some(col => row[col] !== null));

const BulletinTable: React.FC<BulletinTableProps> = ({
  flattenedSubjects,
  handleSubjectUpdate,
  totals,
  maxTotals,
  percentages,
  initialGradesMapping = {},
  ranking,
  gradesMatrix,
}) => {
  const {
    sum1erP,
    sum2emeP,
    sumExam1,
    sumTotal1,
    sum3emeP,
    sum4emeP,
    sumExam2,
    sumTotal2,
    sumGeneral,
  } = totals;
  const {
    sumMax1erP,
    sumMax2emeP,
    sumMaxExam1,
    sumMaxTotal1,
    sumMax3emeP,
    sumMax4emeP,
    sumMaxExam2,
    sumMaxTotal2,
    totalMaxGeneralDisplayed,
  } = maxTotals;
  const {
    percent1erP,
    percent2emeP,
    percentExam1,
    percentTotal1,
    percent3emeP,
    percent4emeP,
    percentExam2,
    percentTotal2,
    percentGeneral,
  } = percentages;

  /* 
   * Pour afficher le total du 1er semestre et ses agrégats, il faut que 
   * pour TOUTES les lignes, les colonnes 0, 1 et 2 soient renseignées.
   */
  const completeFirstSem =
    gradesMatrix.length > 0 &&
    gradesMatrix.every(row => row[0] !== null && row[1] !== null && row[2] !== null);

  /* 
   * De même, pour le 2ème semestre, il faut que les colonnes 3, 4 et 5 soient renseignées.
   */
  const completeSecondSem =
    gradesMatrix.length > 0 &&
    gradesMatrix.every(row => row[3] !== null && row[4] !== null && row[5] !== null);

  /* 
   * Le total général (et ses agrégats) ne s'affiche que si les totaux 
   * des deux semestres sont renseignés.
   */
  const completeGeneral = completeFirstSem && completeSecondSem;

  // Fonction utilitaire pour afficher des cellules vides
  const renderEmptyCells = (count: number, additionalClasses = '') =>
    Array(count)
      .fill('')
      .map((_, i) => (
        <td key={i} className={`border px-2 py-1 text-center ${additionalClasses}`}></td>
      ));

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
        {/* Lignes des matières */}
        {flattenedSubjects.map((subject, idx) => {
          const initialGrades = initialGradesMapping[subject.name];
          return (
            <SubjectRow
              key={idx}
              subject={subject}
              onUpdate={(grades) => handleSubjectUpdate(idx, grades)}
              initialGrades={initialGrades}
            />
          );
        })}

        {/* Ligne MAXIMA (toujours affichée) */}
        <tr className="border px-2 py-1 font-bold">
          <td className="border px-2 py-1 font-bold">MAXIMA GENERAUX</td>
          <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300"></td>
          <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{sumMax1erP}</td>
          <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{sumMax2emeP}</td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{sumMaxExam1}</td>
          <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{sumMaxTotal1}</td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{sumMax3emeP}</td>
          <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{sumMax4emeP}</td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{sumMaxExam2}</td>
          <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{sumMaxTotal2}</td>
          <td className="border px-2 py-1 text-center bg-gray-200 border-gray-300">{totalMaxGeneralDisplayed}</td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
        </tr>

        {/* Ligne TOTAUX */}
        <tr className="border px-2 py-1 font-bold">
          <td className="border px-2 py-1 font-bold">TOTAUX</td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          {/* Colonnes individuelles : 1er P, 2ème P, Exam */}
          <td className="border px-2 py-1 text-center">
            {hasAnyForColumn(gradesMatrix, 0) ? sum1erP : ""}
          </td>
          <td className="border px-2 py-1 text-center">
            {hasAnyForColumn(gradesMatrix, 1) ? sum2emeP : ""}
          </td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center">
            {hasAnyForColumn(gradesMatrix, 2) ? sumExam1 : ""}
          </td>
          {/* Total 1er Semestre uniquement si toutes les 3 notes sont renseignées */}
          <td className="border px-2 py-1 text-center">
            {completeFirstSem ? sumTotal1 : ""}
          </td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          {/* Pour le 2ème semestre */}
          <td className="border px-2 py-1 text-center">
            {hasAnyForColumn(gradesMatrix, 3) ? sum3emeP : ""}
          </td>
          <td className="border px-2 py-1 text-center">
            {hasAnyForColumn(gradesMatrix, 4) ? sum4emeP : ""}
          </td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center">
            {hasAnyForColumn(gradesMatrix, 5) ? sumExam2 : ""}
          </td>
          <td className="border px-2 py-1 text-center">
            {completeSecondSem ? sumTotal2 : ""}
          </td>
          {/* Total Général */}
          <td className="border px-2 py-1 text-center">
            {completeGeneral ? sumGeneral : ""}
          </td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center"></td>
        </tr>

        {/* Ligne POURCENTAGE */}
        <tr className="border px-2 py-1 font-bold">
          <td className="border px-2 py-1 font-bold">POURCENTAGE</td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center">
            {hasAnyForColumn(gradesMatrix, 0) ? percent1erP : ""}
          </td>
          <td className="border px-2 py-1 text-center">
            {hasAnyForColumn(gradesMatrix, 1) ? percent2emeP : ""}
          </td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center">
            {hasAnyForColumn(gradesMatrix, 2) ? percentExam1 : ""}
          </td>
          <td className="border px-2 py-1 text-center">
            {completeFirstSem ? percentTotal1 : ""}
          </td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center">
            {hasAnyForColumn(gradesMatrix, 3) ? percent3emeP : ""}
          </td>
          <td className="border px-2 py-1 text-center">
            {hasAnyForColumn(gradesMatrix, 4) ? percent4emeP : ""}
          </td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center">
            {hasAnyForColumn(gradesMatrix, 5) ? percentExam2 : ""}
          </td>
          <td className="border px-2 py-1 text-center">
            {completeSecondSem ? percentTotal2 : ""}
          </td>
          <td className="border px-2 py-1 text-center">
            {completeGeneral ? percentGeneral : ""}
          </td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          <td className="border px-2 py-1 text-center"></td>
        </tr>

        {/* Ligne PLACE/NBRE ÉLÈVES (optionnelle) */}
        {ranking && (
          <tr className="border px-2 py-1 font-bold">
            <td className="border px-2 py-1 font-bold">PLACE/NBRE ÉLÈVES</td>
            <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
            <td className="border px-2 py-1 text-center">
              {hasAnyForColumn(gradesMatrix, 0)
                ? `${ranking.firstP.rank} / ${ranking.firstP.total}`
                : ""}
            </td>
            <td className="border px-2 py-1 text-center">
              {hasAnyForColumn(gradesMatrix, 1)
                ? `${ranking.secondP.rank} / ${ranking.secondP.total}`
                : ""}
            </td>
            <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
            <td className="border px-2 py-1 text-center">
              {hasAnyForColumn(gradesMatrix, 2)
                ? `${ranking.exam1.rank} / ${ranking.exam1.total}`
                : ""}
            </td>
            <td className="border px-2 py-1 text-center">
              {completeFirstSem
                ? `${ranking.total1.rank} / ${ranking.total1.total}`
                : ""}
            </td>
            <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
            <td className="border px-2 py-1 text-center">
              {hasAnyForColumn(gradesMatrix, 3)
                ? `${ranking.thirdP.rank} / ${ranking.thirdP.total}`
                : ""}
            </td>
            <td className="border px-2 py-1 text-center">
              {hasAnyForColumn(gradesMatrix, 4)
                ? `${ranking.fourthP.rank} / ${ranking.fourthP.total}`
                : ""}
            </td>
            <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
            <td className="border px-2 py-1 text-center">
              {hasAnyForColumn(gradesMatrix, 5)
                ? `${ranking.exam2.rank} / ${ranking.exam2.total}`
                : ""}
            </td>
            <td className="border px-2 py-1 text-center">
              {completeSecondSem
                ? `${ranking.total2.rank} / ${ranking.total2.total}`
                : ""}
            </td>
            <td className="border px-2 py-1 text-center">
              {completeGeneral
                ? `${ranking.overall.rank} / ${ranking.overall.total}`
                : ""}
            </td>
            <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
            <td className="border px-2 py-1 text-center"></td>
            <td className="border px-2 py-1 text-center"></td>
          </tr>
        )}

        {/* Ligne APPLICATION */}
        <tr className="border px-2 py-1 font-bold">
          <td className="border px-2 py-1 font-bold">APPLICATION</td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          {renderEmptyCells(2)}
          {renderEmptyCells(4, 'bg-gray-500 border-gray-500')}
          {renderEmptyCells(2)}
          {renderEmptyCells(5, 'bg-gray-500 border-gray-500')}
        </tr>

        {/* Ligne CONDUITE */}
        <tr className="border px-2 py-1 font-bold">
          <td className="border px-2 py-1 font-bold">CONDUITE</td>
          <td className="border px-2 py-1 text-center bg-gray-500 border-gray-500"></td>
          {renderEmptyCells(2)}
          {renderEmptyCells(4, 'bg-gray-500 border-gray-500')}
          {renderEmptyCells(2)}
          {renderEmptyCells(5, 'bg-gray-500 border-gray-500')}
        </tr>
      </tbody>
    </table>
  );
};

export default BulletinTable;
