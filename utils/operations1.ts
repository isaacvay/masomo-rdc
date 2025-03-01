// src/utils/operations.ts

import { Section } from '../data/sections';

/**
 * Calcule les totaux par colonne à partir des notes de chaque matière.
 * @param grades Un tableau de tableaux contenant 9 valeurs pour chaque matière.
 * @returns Un tableau de 9 nombres correspondant aux totaux par colonne.
 */
export const calculateTotals = (grades: number[][]): number[] => {
  const totals = Array(9).fill(0);
  grades.forEach((subjectGrades) => {
    if (subjectGrades && subjectGrades.length >= 7) {
      // Premier semestre : indices 0, 1, 2
      const note0 = subjectGrades[0] || 0;
      const note1 = subjectGrades[1] || 0;
      const note2 = subjectGrades[2] || 0;
      const firstSemTotal = note0 + note1 + note2;
      totals[0] += note0;
      totals[1] += note1;
      totals[2] += note2;
      totals[3] += firstSemTotal;
      // Second semestre : indices 4, 5, 6
      const note4 = subjectGrades[4] || 0;
      const note5 = subjectGrades[5] || 0;
      const note6 = subjectGrades[6] || 0;
      const secondSemTotal = note4 + note5 + note6;
      totals[4] += note4;
      totals[5] += note5;
      totals[6] += note6;
      totals[7] += secondSemTotal;
      // Total général
      totals[8] += firstSemTotal + secondSemTotal;
    }
  });
  return totals;
};

/**
 * Calcule les maxima théoriques pour chacune des 9 colonnes en fonction des sections.
 * @param sections Le tableau des sections contenant leurs maxima et leurs matières.
 * @returns Un tableau de 9 nombres correspondant aux maxima généraux.
 */
export const calculateMaxTotals = (sections: Section[]): number[] => {
  const maxTotals = Array(9).fill(0);
  sections.forEach((section) => {
    section.subjects.forEach(() => {
      maxTotals[0] += section.maxima[0];
      maxTotals[1] += section.maxima[1];
      maxTotals[2] += section.maxima[2];
      // Total du premier semestre = somme des 3 premières valeurs
      maxTotals[3] += section.maxima[0] + section.maxima[1] + section.maxima[2];
      maxTotals[4] += section.maxima[4];
      maxTotals[5] += section.maxima[5];
      maxTotals[6] += section.maxima[6];
      // Total du second semestre = somme des indices 4, 5, 6
      maxTotals[7] += section.maxima[4] + section.maxima[5] + section.maxima[6];
      // Total général
      maxTotals[8] += section.maxima[8];
    });
  });
  return maxTotals;
};

/**
 * Calcule le pourcentage obtenu pour chaque colonne par rapport aux maxima.
 * @param totals Le tableau des totaux obtenus.
 * @param maxTotals Le tableau des maxima théoriques.
 * @returns Un tableau de chaînes de caractères représentant le pourcentage pour chaque colonne.
 */
export const calculatePercentages = (totals: number[], maxTotals: number[]): string[] => {
  return totals.map((total, i) =>
    maxTotals[i] > 0 ? ((total / maxTotals[i]) * 100).toFixed(2) : '-'
  );
};

/**
 * Calcule des pourcentages spécifiques : examens, totaux semestriels et général.
 * @param totals Le tableau des totaux obtenus.
 * @param maxTotals Le tableau des maxima théoriques.
 * @returns Un objet contenant les pourcentages pour les examens, les semestres et le total général.
 */
export const computeSpecificPercentages = (
  totals: number[],
  maxTotals: number[]
): {
  examPercentage: string;
  totalSemesterPercentage: string;
  generalPercentage: string;
} => {
  // Pourcentage des examens : somme des colonnes 2 (premier sem) et 6 (second sem)
  const examObtained = totals[2] + totals[6];
  const examMax = maxTotals[2] + maxTotals[6];
  const examPercentage = examMax > 0 ? ((examObtained / examMax) * 100).toFixed(2) : '-';

  // Pourcentage des totaux semestriels : somme des colonnes 3 et 7
  const totalSemesterObtained = totals[3] + totals[7];
  const totalSemesterMax = maxTotals[3] + maxTotals[7];
  const totalSemesterPercentage =
    totalSemesterMax > 0 ? ((totalSemesterObtained / totalSemesterMax) * 100).toFixed(2) : '-';

  // Pourcentage du total général : colonne 8
  const generalObtained = totals[8];
  const generalMax = maxTotals[8];
  const generalPercentage = generalMax > 0 ? ((generalObtained / generalMax) * 100).toFixed(2) : '-';

  return { examPercentage, totalSemesterPercentage, generalPercentage };
};
