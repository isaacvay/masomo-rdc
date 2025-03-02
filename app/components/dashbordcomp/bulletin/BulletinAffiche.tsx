"use client";
import React, { useState, useMemo, useEffect } from 'react';
import BulletinHeader from './BulletinHeader';
import BulletinInfo from './BulletinInfo';
import BulletinTable from './BulletinTable';
import BulletinFooter from './BulletinFooter';
import { sections, Subject } from '@/data/cours';
import {
  calculateTotals,
  calculateMaxTotals,
  calculatePercentage,
  Totals,
  MaxTotals,
} from '@/utils/operations';
import { firestore } from '@/config/firebase';
import { collection, getDocs, doc } from 'firebase/firestore';

export interface BulletinAfficheProps {
  selectedStudent: {
    displayName: string;
    sexe: string;
    neEA: string;
    naissance: string;
    classe: string;
    section: string;
    numPerm: string;
    schoolId: string;
  };
  schoolInfo: {
    province: string;
    ville: string;
    commune: string;
    nom: string;
    code: string;
  };
}

interface GradeEntry {
  studentId?: string;
  studentName: string;
  numPerm: string;
  grades: string[]; // Les notes sont sauvegardées sous forme de chaînes
  course: string;
  class: string;
  timestamp: string;
}

interface StudentAggregate {
  numPerm: string;
  aggregates: {
    firstP: number;
    secondP: number;
    exam1: number;
    total1: number;
    thirdP: number;
    fourthP: number;
    exam2: number;
    total2: number;
    overall: number;
  };
}

interface Rankings {
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

const BulletinAffiche: React.FC<BulletinAfficheProps> = ({ selectedStudent, schoolInfo }) => {
  // Filtrer les sections selon la classe de l'élève
  const filteredSections = useMemo(
    () => sections.filter((section) => section.classe.includes(selectedStudent.classe)),
    [selectedStudent.classe]
  );

  // Calculer le nombre total de matières (toutes sections confondues)
  const totalSubjects = useMemo(
    () => filteredSections.reduce((count, section) => count + section.subjects.length, 0),
    [filteredSections]
  );

  // État pour stocker les notes (6 valeurs par matière)
  const [allGrades, setAllGrades] = useState<number[][]>(
    Array(totalSubjects).fill(null).map(() => Array(6).fill(0))
  );

  // Réinitialiser les notes si le nombre de matières change
  useEffect(() => {
    setAllGrades(Array(totalSubjects).fill(null).map(() => Array(6).fill(0)));
  }, [totalSubjects]);

  const handleSubjectUpdate = (index: number, grades: number[]) => {
    setAllGrades((prevGrades) => {
      const updatedGrades = [...prevGrades];
      updatedGrades[index] = grades;
      return updatedGrades;
    });
  };

  // Calcul des totaux et pourcentages
  const totals: Totals = useMemo(() => calculateTotals(allGrades), [allGrades]);
  const maxTotals: MaxTotals = useMemo(() => calculateMaxTotals(filteredSections), [filteredSections]);
  const percentages = {
    percent1erP: calculatePercentage(totals.sum1erP, maxTotals.sumMax1erP),
    percent2emeP: calculatePercentage(totals.sum2emeP, maxTotals.sumMax2emeP),
    percentExam1: calculatePercentage(totals.sumExam1, maxTotals.sumMaxExam1),
    percentTotal1: calculatePercentage(totals.sumTotal1, maxTotals.sumMaxTotal1),
    percent3emeP: calculatePercentage(totals.sum3emeP, maxTotals.sumMax3emeP),
    percent4emeP: calculatePercentage(totals.sum4emeP, maxTotals.sumMax4emeP),
    percentExam2: calculatePercentage(totals.sumExam2, maxTotals.sumMaxExam2),
    percentTotal2: calculatePercentage(totals.sumTotal2, maxTotals.sumMaxTotal2),
    percentGeneral: calculatePercentage(totals.sumGeneral, maxTotals.totalMaxGeneralDisplayed),
  };

  // Aplatir la liste des matières pour le rendu
  const flattenedSubjects = useMemo(() => {
    return filteredSections.reduce((acc, section) => acc.concat(section.subjects), [] as Subject[]);
  }, [filteredSections]);

  // Récupérer les entrées de notes depuis Firestore pour TOUS les élèves de la classe
  const [gradeEntries, setGradeEntries] = useState<GradeEntry[]>([]);
  useEffect(() => {
    async function fetchGrades() {
      if (!selectedStudent.schoolId) {
        console.log("schoolId non défini dans selectedStudent, attente...");
        return;
      }
      try {
        const gradesCollectionRef = collection(doc(firestore, "schools", selectedStudent.schoolId), "grades");
        const querySnapshot = await getDocs(gradesCollectionRef);
        const data: GradeEntry[] = querySnapshot.docs.map((doc) => doc.data() as GradeEntry);
        const classEntries = data.filter((entry) => entry.class === selectedStudent.classe);
        setGradeEntries(classEntries);
      } catch (error) {
        console.error("Erreur lors de la récupération des notes :", error);
      }
    }
    fetchGrades();
  }, [selectedStudent]);

  // Construire un mapping des notes pour l'élève sélectionné
  const initialGradesMapping: Record<string, number[]> = useMemo(() => {
    const mapping: Record<string, number[]> = {};
    gradeEntries
      .filter((entry) => entry.numPerm === selectedStudent.numPerm)
      .forEach((entry) => {
        const parsedGrades = entry.grades.map((g) => {
          const n = parseFloat(g);
          return isNaN(n) ? 0 : n;
        });
        mapping[entry.course] = parsedGrades;
      });
    return mapping;
  }, [gradeEntries, selectedStudent]);

  // Calcul des agrégats pour chaque élève de la classe (pour le classement)
  const studentAggregates: StudentAggregate[] = useMemo(() => {
    const aggregatesMap = new Map<string, {
      firstP: number;
      secondP: number;
      exam1: number;
      total1: number;
      thirdP: number;
      fourthP: number;
      exam2: number;
      total2: number;
      overall: number;
    }>();
    gradeEntries.forEach((entry) => {
      let agg = aggregatesMap.get(entry.numPerm);
      if (!agg) {
        agg = { firstP: 0, secondP: 0, exam1: 0, total1: 0, thirdP: 0, fourthP: 0, exam2: 0, total2: 0, overall: 0 };
        aggregatesMap.set(entry.numPerm, agg);
      }
      const g = entry.grades.map((g) => {
        const n = parseFloat(g);
        return isNaN(n) ? 0 : n;
      });
      agg.firstP += g[0] || 0;
      agg.secondP += g[1] || 0;
      agg.exam1 += g[2] || 0;
      agg.total1 += (g[0] || 0) + (g[1] || 0) + (g[2] || 0);
      agg.thirdP += g[3] || 0;
      agg.fourthP += g[4] || 0;
      agg.exam2 += g[5] || 0;
      agg.total2 += (g[3] || 0) + (g[4] || 0) + (g[5] || 0);
      agg.overall = agg.total1 + agg.total2;
    });
    const results: StudentAggregate[] = [];
    aggregatesMap.forEach((value, key) => {
      results.push({ numPerm: key, aggregates: value });
    });
    return results;
  }, [gradeEntries]);

  // Fonction de classement pour une catégorie donnée
  const rankFor = (category: keyof StudentAggregate['aggregates']) => {
    const sorted = studentAggregates.slice().sort((a, b) => b.aggregates[category] - a.aggregates[category]);
    const total = sorted.length;
    const index = sorted.findIndex((item) => item.numPerm === selectedStudent.numPerm);
    return { rank: index === -1 ? 0 : index + 1, total };
  };

  const rankings: Rankings = useMemo(() => ({
    firstP: rankFor('firstP'),
    secondP: rankFor('secondP'),
    exam1: rankFor('exam1'),
    total1: rankFor('total1'),
    thirdP: rankFor('thirdP'),
    fourthP: rankFor('fourthP'),
    exam2: rankFor('exam2'),
    total2: rankFor('total2'),
    overall: rankFor('overall')
  }), [studentAggregates, selectedStudent]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-100 pt-5 p-4 sm:p-8">
      {/* Sur mobile, scale-50 pour une version plus miniature, avec origin-top pour conserver l'alignement en haut */}
      <div className="transform scale-40 md:scale-100 origin-top">
        <div className="w-full max-w-6xl bg-white rounded-xl shadow-2xl p-4 sm:p-6 md:p-8">
          <BulletinHeader />
          <BulletinInfo selectedStudent={selectedStudent} schoolInfo={schoolInfo} />
          <div className="overflow-x-auto">
            <BulletinTable 
              flattenedSubjects={flattenedSubjects}
              handleSubjectUpdate={handleSubjectUpdate}
              totals={totals}
              maxTotals={maxTotals}
              percentages={percentages}
              initialGradesMapping={initialGradesMapping}
              ranking={rankings}
            />
          </div>
          <BulletinFooter />
        </div>
      </div>
    </div>
  );
};

export default BulletinAffiche;
