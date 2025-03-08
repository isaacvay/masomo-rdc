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
  Totals,
  MaxTotals,
} from '@/utils/operations';
import { firestore } from '@/config/firebase';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/config/firebase";

export interface BulletinAfficheProps {
  selectedStudent: {
    displayName: string;
    sexe: string;
    neEA: string;
    naissance: string;
    classe: string;
    section: string;
    numPerm: string;
    bulletinId: string; // Si défini, on l'utilisera comme nom du document
    schoolId: string;
  };
  schoolInfo: {
    province: string;
    ville: string;
    commune: string;
    nom: string;
    code: string;
  };
  accountType?: 'school' | 'teacher' | string;
}

interface GradeEntry {
  studentId?: string;
  studentName: string;
  numPerm: string;
  grades: string[];
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

const safePercentage = (value: number, total: number): string => {
  if (total === 0 || value === undefined || value === null || isNaN(value)) return "0";
  const percentage = (value / total) * 100;
  return percentage.toFixed(1);
};

const BulletinAffiche: React.FC<BulletinAfficheProps> = ({ selectedStudent, schoolInfo, accountType = '' }) => {
  // Gestion du rôle connecté
  const [userRole, setUserRole] = useState<string>('');
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRole((data.role || '').toLowerCase());
        }
      }
    });
    return () => unsubscribe();
  }, []);

  console.log("Valeur accountType :", accountType);
  const normalizedAccountType = accountType.toLowerCase();
  const filteredSections = useMemo(
    () => sections.filter((section) => section.classe.includes(selectedStudent.classe)),
    [selectedStudent.classe]
  );

  const totalSubjects = useMemo(
    () => filteredSections.reduce((count, section) => count + section.subjects.length, 0),
    [filteredSections]
  );

  const [allGrades, setAllGrades] = useState<(number | null)[][]>(
    Array(totalSubjects).fill(null).map(() => Array(6).fill(null))
  );

  useEffect(() => {
    setAllGrades(Array(totalSubjects).fill(null).map(() => Array(6).fill(null)));
  }, [totalSubjects]);

  const handleSubjectUpdate = (index: number, grades: (number | null)[]) => {
    setAllGrades((prevGrades) => {
      const updatedGrades = [...prevGrades];
      updatedGrades[index] = grades;
      return updatedGrades;
    });
  };

  const totals: Totals = useMemo(
    () => calculateTotals(allGrades.map(row => row.map(val => val ?? 0))),
    [allGrades]
  );
  const maxTotals: MaxTotals = useMemo(() => calculateMaxTotals(filteredSections), [filteredSections]);
  const percentages = {
    percent1erP: safePercentage(totals.sum1erP, maxTotals.sumMax1erP),
    percent2emeP: safePercentage(totals.sum2emeP, maxTotals.sumMax2emeP),
    percentExam1: safePercentage(totals.sumExam1, maxTotals.sumMaxExam1),
    percentTotal1: safePercentage(totals.sumTotal1, maxTotals.sumMaxTotal1),
    percent3emeP: safePercentage(totals.sum3emeP, maxTotals.sumMax3emeP),
    percent4emeP: safePercentage(totals.sum4emeP, maxTotals.sumMax4emeP),
    percentExam2: safePercentage(totals.sumExam2, maxTotals.sumMaxExam2),
    percentTotal2: safePercentage(totals.sumTotal2, maxTotals.sumMaxTotal2),
    percentGeneral: safePercentage(totals.sumGeneral, maxTotals.totalMaxGeneralDisplayed),
  };

  const flattenedSubjects = useMemo(() => {
    return filteredSections.reduce((acc, section) => acc.concat(section.subjects), [] as Subject[]);
  }, [filteredSections]);

  const [gradeEntries, setGradeEntries] = useState<GradeEntry[]>([]);
  const [bulletinId, setBulletinId] = useState<string | null>(null);
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

  const initialGradesMapping: Record<string, (number | null)[]> = useMemo(() => {
    const mapping: Record<string, (number | null)[]> = {};
    gradeEntries
      .filter((entry) => entry.numPerm === selectedStudent.numPerm)
      .forEach((entry) => {
        const parsedGrades = entry.grades.map((g) => {
          const n = parseFloat(g);
          return isNaN(n) ? null : n;
        });
        mapping[entry.course] = parsedGrades;
      });
    return mapping;
  }, [gradeEntries, selectedStudent]);

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

  const handleSaveBulletin = async () => {
    try {
      const bulletinCollectionRef = collection(firestore, "publicBulletins");
      
      // Conversion de la matrice 2D en objet indexé par le nom de la matière
      const flattenedGrades = allGrades.reduce<Record<string, (number | null)[]>>((acc, row, index) => {
        const subjectName = flattenedSubjects[index]?.name || `subject_${index}`;
        acc[subjectName] = row.map(val => (val === null || val === undefined) ? null : Number(val));
        return acc;
      }, {});
      
      const gradesMetadata = {
        rowCount: allGrades.length,
        colCount: allGrades[0]?.length || 0
      };
      
      const sanitizedTotals = Object.entries(totals).reduce((acc: Totals, [key, value]) => {
        (acc as any)[key] = typeof value === 'number' && Number.isFinite(value) ? value : 0;
        return acc;
      }, {} as Totals);
      
      const sanitizedMaxTotals = Object.entries(maxTotals).reduce((acc, [key, value]) => {
        acc[key as keyof MaxTotals] = typeof value === 'number' && Number.isFinite(value) ? value : 0;
        return acc;
      }, {} as MaxTotals);
      
      const sanitizedPercentages = Object.entries(percentages).reduce((acc, [key, value]) => {
        acc[key] = value || "0";
        return acc;
      }, {} as Record<string, string>);
      
      const sanitizedStudent = {
        displayName: selectedStudent.displayName || "",
        sexe: selectedStudent.sexe || "",
        neEA: selectedStudent.neEA || "",
        naissance: selectedStudent.naissance || "",
        classe: selectedStudent.classe || "",
        section: selectedStudent.section || "",
        numPerm: selectedStudent.numPerm || "",
        schoolId: selectedStudent.schoolId || ""
      };
      
      const sanitizedSchool = {
        province: schoolInfo.province || "",
        ville: schoolInfo.ville || "",
        commune: schoolInfo.commune || "",
        nom: schoolInfo.nom || "",
        code: schoolInfo.code || ""
      };
      
      const bulletinData = {
        student: sanitizedStudent,
        school: sanitizedSchool,
        grades: flattenedGrades,
        gradesMetadata: gradesMetadata,
        totals: sanitizedTotals,
        maxTotals: sanitizedMaxTotals,
        percentages: sanitizedPercentages,
        timestamp: serverTimestamp()
      };

      // Si bulletinId est défini dans selectedStudent, on l'utilise comme nom du document.
      if(selectedStudent.bulletinId) {
        const bulletinDocRef = doc(firestore, "publicBulletins", selectedStudent.bulletinId);
        // setDoc permet de créer ou mettre à jour le document avec cet ID
        await setDoc(bulletinDocRef, bulletinData, { merge: true });
        console.log("Bulletin enregistré/mis à jour avec l'ID personnalisé :", selectedStudent.bulletinId);
        alert("Bulletin enregistré/mis à jour avec succès !");
      } else {
        // Sinon, création d'un document avec un ID généré automatiquement
        const docRef = await addDoc(bulletinCollectionRef, bulletinData);
        setBulletinId(docRef.id);
        console.log("Document sauvegardé avec ID généré :", docRef.id);
        alert("Bulletin enregistré avec succès !");
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du bulletin :", error);
      alert(`Erreur lors de l'enregistrement du bulletin: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-100 pt-5 p-4 sm:p-8">
      <div className="transform scale-30 md:scale-100 origin-top">
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
              gradesMatrix={allGrades}
            />
          </div>
          <BulletinFooter />
          <div className="mt-4 flex justify-between">
          {(userRole === 'école' || userRole === 'professeur') && (
            <button
              onClick={handleSaveBulletin}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Sauvegarder le Bulletin
            </button>
          )}
          <div className="mt-4 text-right text-gray-600  "> Code de Verification: <strong>{selectedStudent.bulletinId}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulletinAffiche;
