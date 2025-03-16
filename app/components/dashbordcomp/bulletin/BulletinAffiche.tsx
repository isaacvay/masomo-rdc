"use client";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from "react-qr-code";
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
  setDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/config/firebase";
import { FaPrint } from 'react-icons/fa';

export interface BulletinAfficheProps {
  selectedStudent: {
    displayName: string;
    sexe: string;
    neEA: string;
    naissance: string;
    classe: string;
    section: string;
    numPerm: string;
    bulletinId: string;
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
  // Référence du conteneur à exporter en PDF (contenant tout le bulletin)
  const printRef = useRef<HTMLDivElement>(null);

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

  const filteredSections = useMemo(
    () => sections.filter((section) => section.classe.includes(selectedStudent.classe)),
    [selectedStudent.classe]
  );

  const totalSubjects = useMemo(
    () => filteredSections.reduce((count, section) => count + section.subjects.length, 0),
    [filteredSections]
  );

  // Matrice des notes (6 colonnes par matière)
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

  // Récupération des notes depuis Firestore
  const [gradeEntries, setGradeEntries] = useState<GradeEntry[]>([]);
  const [bulletinId, setBulletinId] = useState<string | null>(null);
  useEffect(() => {
    async function fetchGrades() {
      if (!selectedStudent.schoolId) {
        console.log("schoolId non défini, attente...");
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

  // Calcul des agrégats pour le classement
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

  // Enregistrement du bulletin dans Firestore
// Enregistrement du bulletin dans Firestore
const handleSaveBulletin = async () => {
  try {
    const bulletinCollectionRef = collection(firestore, "publicBulletins");
    
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

    // Ajout des informations de ranking pour chaque période et total
    const bulletinData = {
      student: sanitizedStudent,
      school: sanitizedSchool,
      grades: flattenedGrades,
      gradesMetadata: gradesMetadata,
      totals: sanitizedTotals,
      maxTotals: sanitizedMaxTotals,
      percentages: sanitizedPercentages,
      rankings: {
        firstP: rankings.firstP,    // { rank: ..., total: ... }
        secondP: rankings.secondP,
        exam1: rankings.exam1,
        total1: rankings.total1,
        thirdP: rankings.thirdP,
        fourthP: rankings.fourthP,
        exam2: rankings.exam2,
        total2: rankings.total2,
        overall: rankings.overall
      },
      anneeScolaire: "2023-2024", // vous pouvez passer cette valeur dynamiquement via props si besoin
      timestamp: serverTimestamp()
    };

    if(selectedStudent.bulletinId) {
      const bulletinDocRef = doc(firestore, "publicBulletins", selectedStudent.bulletinId);
      await setDoc(bulletinDocRef, bulletinData, { merge: true });
      console.log("Bulletin enregistré/mis à jour :", selectedStudent.bulletinId);
      alert("Bulletin enregistré/mis à jour avec succès !");
    } else {
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



  // URL du QR code de vérification
  const qrCodeUrl = useMemo(() => {
    return `https://www.masomordc.com/pages/verification-bulletin?bulletinId=${selectedStudent.bulletinId || ''}`;
  }, [selectedStudent.bulletinId]);

  // Export en PDF
  const handleExportPDF = () => {
    if (!printRef.current) return;
  
    html2canvas(printRef.current, { scale: 2, useCORS: true, allowTaint: false })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
  
        // Conversion des dimensions du canvas en mm
        const pxToMm = 25.4 / 96;
        const imgWidth = canvas.width * pxToMm;
        const imgHeight = canvas.height * pxToMm;
  
        // Calcul du ratio pour adapter l'image à la page
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const newWidth = imgWidth * ratio;
        const newHeight = imgHeight * ratio;
  
        // Centrage de l'image
        const offsetX = (pdfWidth - newWidth) / 2;
        const offsetY = (pdfHeight - newHeight) / 2;
  
        pdf.addImage(imgData, 'PNG', offsetX, offsetY, newWidth, newHeight);
  
        // Détection du mobile
        const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.navigator.maxTouchPoints > 1;
  
        if (isMobile) {
          // Télécharger le PDF sur mobile
          pdf.save(`Bulletin_${selectedStudent.numPerm}.pdf`);
        } else {
          // Ouvrir dans un nouvel onglet sur ordinateur
          const pdfBlob = pdf.output('blob');
          const pdfUrl = URL.createObjectURL(pdfBlob);
          window.open(pdfUrl, '_blank');
        }
      })
      .catch((error) => {
        console.error("html2canvas error:", error);
        alert("Erreur lors de la génération du PDF. Vérifiez la console pour plus d'informations.");
      });
  };
  
  

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-100 p-4 sm:p-8">
     
      {/* Boutons interactifs non exportés (masqués via la classe "no-print") */}
      <div className="mb-4 flex flex-col sm:flex-row justify-between w-full md:w-auto items-center ml-auto no-print">
        {(userRole === 'école' || userRole === 'professeur') && (
          <button
            onClick={handleSaveBulletin}
            className="px-4 py-2 bg-blue-500 w-full md:w-auto text-white rounded hover:bg-blue-600"
          >
            Sauvegarder le Bulletin
          </button>
        )}
       
          <button
          onClick={handleExportPDF}
          className="mt-2 ml-0 md:ml-4 px-4 py-2 w-full md:w-auto bg-green-500 text-white rounded hover:bg-green-600 flex justify-center items-center"
        >
          <FaPrint className="w-4 h-4 mr-2" /> Exporter en PDF
        </button>
      
       
      </div>
      <div className="m-0 p-0 overflow-hidden transform scale-30 md:scale-100 origin-top">
      {/* Conteneur exporté en PDF contenant tout le bulletin */}
      <div
        className="w-full max-w-6xl bg-white rounded-xl shadow-2xl p-2 sm:p-4 md:p-6"
        ref={printRef}
      >
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
        {/* Bloc QR Code et Code de Vérification */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex flex-col justify-center mt-3 items-start text-left">
            <p>(1)Biffer la mention inutile</p>
            <p>
              Note importante : Le bulletin est sans valeur s’il est raturé ou surchargé
            </p>
          </div>
          <div className="flex justify-center items-center mb-3">
            <QRCode value={qrCodeUrl} size={60} />
          </div>
          <div className="mt-4 flex flex-col justify-center items-center text-right">
            <div className="mt-7 text-gray-600">
              Code de Vérification: <strong>{selectedStudent.bulletinId}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default BulletinAffiche;
