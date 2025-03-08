// components/Bulletin/BulletinTypes.ts

export interface Subject {
    name: string;
    // Tableau des valeurs maximales pour chaque note (6 indices)
    maxima: number[]; // ex: [max1, max2, max3, max4, max5, max6]
  }
  
  export interface Bulletin {
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
  