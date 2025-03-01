// /utils/operations.ts

export interface Totals {
    sum1erP: number;
    sum2emeP: number;
    sumExam1: number;
    sumTotal1: number;
    sum3emeP: number;
    sum4emeP: number;
    sumExam2: number;
    sumTotal2: number;
    sumGeneral: number;
  }
  
  export interface MaxTotals {
    sumMax1erP: number;
    sumMax2emeP: number;
    sumMaxExam1: number;
    sumMaxTotal1: number;
    sumMax3emeP: number;
    sumMax4emeP: number;
    sumMaxExam2: number;
    sumMaxTotal2: number;
    totalMaxGeneralDisplayed: number;
  }
  
  /**
   * Calcule les totaux des notes à partir d'un tableau de notes.
   */
  export const calculateTotals = (allGrades: number[][]): Totals => {
    return allGrades.reduce(
      (sums, grades) => {
        const p1 = grades[0] || 0;
        const p2 = grades[1] || 0;
        const exam1 = grades[2] || 0;
        const p3 = grades[3] || 0;
        const p4 = grades[4] || 0;
        const exam2 = grades[5] || 0;
        const firstSem = p1 + p2 + exam1;
        const secondSem = p3 + p4 + exam2;
        return {
          sum1erP: sums.sum1erP + p1,
          sum2emeP: sums.sum2emeP + p2,
          sumExam1: sums.sumExam1 + exam1,
          sumTotal1: sums.sumTotal1 + firstSem,
          sum3emeP: sums.sum3emeP + p3,
          sum4emeP: sums.sum4emeP + p4,
          sumExam2: sums.sumExam2 + exam2,
          sumTotal2: sums.sumTotal2 + secondSem,
          sumGeneral: sums.sumGeneral + firstSem + secondSem,
        };
      },
      {
        sum1erP: 0,
        sum2emeP: 0,
        sumExam1: 0,
        sumTotal1: 0,
        sum3emeP: 0,
        sum4emeP: 0,
        sumExam2: 0,
        sumTotal2: 0,
        sumGeneral: 0,
      }
    );
  };
  
  /**
   * Calcule les totaux maximums à partir des sections filtrées.
   */
  export const calculateMaxTotals = (filteredSections: any[]): MaxTotals => {
    return filteredSections.reduce(
      (acc, section) => {
        section.subjects.forEach((subject: any) => {
          acc.sumMax1erP += subject.maxima[0];
          acc.sumMax2emeP += subject.maxima[1];
          acc.sumMaxExam1 += subject.maxima[2];
          acc.sumMaxTotal1 += subject.maxima[3];
          acc.sumMax3emeP += subject.maxima[4];
          acc.sumMax4emeP += subject.maxima[5];
          acc.sumMaxExam2 += subject.maxima[6];
          acc.sumMaxTotal2 += subject.maxima[7];
          acc.totalMaxGeneralDisplayed += subject.maxima[8];
        });
        return acc;
      },
      {
        sumMax1erP: 0,
        sumMax2emeP: 0,
        sumMaxExam1: 0,
        sumMaxTotal1: 0,
        sumMax3emeP: 0,
        sumMax4emeP: 0,
        sumMaxExam2: 0,
        sumMaxTotal2: 0,
        totalMaxGeneralDisplayed: 0,
      }
    );
  };
  
  /**
   * Calcule le pourcentage obtenu sous forme de chaîne formatée.
   */
  export const calculatePercentage = (obtained: number, max: number): string =>
    max > 0 ? ((obtained / max) * 100).toFixed(2) + ' %' : '-';
  