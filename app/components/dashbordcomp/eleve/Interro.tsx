"use client";
import React, { useState, useEffect } from 'react';
import { auth, firestore } from '@/config/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import GradeTable from './interro/GradeTable';
import Header from './interro/Header';
import PeriodNavigation from './interro/PeriodNavigation';
import Statistics from './interro/Statistics';
import Toast from './interro/Toast';
import { sections } from '@/data/cours'; // Assurez-vous que le chemin est correct

interface Student {
  uid: string;
  displayName: string;
  numPerm: string;
  grades: number[];
  average?: number;
}

interface InterroProps {
  selectedCourse: string;
  selectedClass: string;
  onRetour: () => void;
}

export default function Interro({ selectedCourse, selectedClass, onRetour }: InterroProps) {
  const [activePeriod, setActivePeriod] = useState<number>(1);
  const [students, setStudents] = useState<Student[]>([]);
  const [numTests, setNumTests] = useState<number>(6);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [schoolUid, setSchoolUid] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Fonction pour retrouver le maximum d'une épreuve pour le cours sélectionné
  const getCourseMax = (): number => {
    for (const section of sections) {
      if (section.classe.includes(selectedClass)) {
        const course = section.subjects.find(subject => subject.name === selectedCourse);
        if (course) {
          return course.maxima[0];
        }
      }
    }
    return 20;
  };

  // Calcul de la moyenne normalisée sur courseMax
  const calculateAverage = (grades: number[]): number => {
    const courseMax = getCourseMax();
    if (grades.length === 0) return 0;
    const totalObtained = grades.reduce((a, b) => a + b, 0);
    const totalPossible = grades.length * courseMax;
    const normalized = (totalObtained / totalPossible) * courseMax;
    return parseFloat(normalized.toFixed(1));
  };

  // Récupération du schoolUid
  useEffect(() => {
    const loadSchoolUid = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setToast({ message: "Aucun utilisateur connecté", type: 'error' });
        setTimeout(() => setToast(null), 3000);
        return;
      }
      try {
        const q = query(
          collection(firestore, "users"),
          where("email", "==", currentUser.email)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          setSchoolUid(userData.schoolId || currentUser.uid);
        } else {
          setSchoolUid(currentUser.uid);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'école :", error);
        setToast({ message: "Erreur lors de la récupération des informations de l'école", type: 'error' });
        setTimeout(() => setToast(null), 3000);
        setSchoolUid(currentUser.uid);
      }
    };
    loadSchoolUid();
  }, []);

  // Chargement des élèves et de leurs notes depuis Firestore
  useEffect(() => {
    const loadStudentsAndGrades = async () => {
      if (!schoolUid) return;
      setIsLoading(true);
      try {
        // Charger les élèves de la classe
        const usersQuery = query(
          collection(firestore, "users"),
          where("role", "==", "élève"),
          where("schoolId", "==", schoolUid),
          where("classe", "==", selectedClass)
        );
        const usersSnapshot = await getDocs(usersQuery);
        const studentsData = usersSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as Student[];

        // Pour chaque élève, charger les notes de la période active depuis la sous-collection "Interro"
        const studentsWithGrades = await Promise.all(
          studentsData.map(async (student) => {
            try {
              const interroRef = collection(
                firestore,
                `schools/${schoolUid}/students/${student.uid}/Interro`
              );
              const q = query(
                interroRef,
                where("course", "==", selectedCourse),
                where("period", "==", activePeriod)
              );
              const snapshot = await getDocs(q);
              const grades = Array(numTests).fill(0);
              snapshot.forEach(doc => {
                const data = doc.data();
                if (data.testNumber >= 0 && data.testNumber < numTests) {
                  grades[data.testNumber] = data.value;
                }
              });
              return {
                ...student,
                grades,
                average: calculateAverage(grades)
              };
            } catch (error) {
              console.error(`Erreur lors du chargement des notes pour ${student.displayName}:`, error);
              return {
                ...student,
                grades: Array(numTests).fill(0),
                average: 0
              };
            }
          })
        );
        setStudents(studentsWithGrades);
      } catch (error) {
        console.error("Erreur lors du chargement des données :", error);
        setToast({ message: "Erreur lors du chargement des données", type: 'error' });
        setTimeout(() => setToast(null), 3000);
      } finally {
        setIsLoading(false);
      }
    };
    if (schoolUid) {
      loadStudentsAndGrades();
    }
  }, [schoolUid, selectedClass, selectedCourse, activePeriod, numTests]);

  // Gestion de la modification d'une note
  const handleGradeChange = (studentId: string, testIndex: number, value: string) => {
    const numericValue = parseFloat(value) || 0;
    const newGrade = value === '' ? 0 : Math.min(getCourseMax(), Math.max(0, numericValue));
    setStudents(students.map(student => {
      if (student.uid === studentId) {
        const newGrades = [...student.grades];
        newGrades[testIndex] = newGrade;
        return {
          ...student,
          grades: newGrades,
          average: calculateAverage(newGrades)
        };
      }
      return student;
    }));
  };

  // Ajout et suppression d'une épreuve
  const addTest = () => {
    const newNumTests = numTests + 1;
    setNumTests(newNumTests);
    setStudents(students.map(student => ({
      ...student,
      grades: [...student.grades, 0],
      average: calculateAverage([...student.grades, 0])
    })));
  };

  const removeTest = () => {
    if (numTests > 1) {
      const newNumTests = numTests - 1;
      setNumTests(newNumTests);
      setStudents(students.map(student => ({
        ...student,
        grades: student.grades.slice(0, -1),
        average: calculateAverage(student.grades.slice(0, -1))
      })));
    }
  };

  // Enregistrement complet : notes détaillées et moyennes par période
  const handleSave = async () => {
    if (!schoolUid) {
      setToast({ message: "Erreur: École non identifiée", type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setIsSaving(true);
    try {
      // 1. Enregistrement des notes détaillées dans la sous-collection "Interro"
      const savePromises = students.flatMap(student =>
        student.grades.map(async (grade, testNumber) => {
          // Enregistre seulement si la note est supérieure à zéro (ou selon une logique choisie)
          if (grade > 0) {
            const interroCollectionRef = collection(
              firestore,
              `schools/${schoolUid}/students/${student.uid}/Interro`
            );
            const gradeDocRef = doc(
              interroCollectionRef,
              `${selectedCourse}.period${activePeriod}.test${testNumber}`
            );
            await setDoc(gradeDocRef, {
              value: grade,
              date: new Date(),
              period: activePeriod,
              testNumber,
              course: selectedCourse,
              class: selectedClass,
              studentName: student.displayName,
              studentId: student.uid
            }, { merge: true });
          }
        })
      );

      // 2. Mise à jour des moyennes dans le document principal
      const updatePromises = students.map(async student => {
        const gradeDocRef = doc(
          firestore,
          "schools",
          schoolUid,
          "grades",
          `${student.numPerm}_${selectedCourse}`
        );
        
        // Création d'un tableau pour 4 périodes (les indices 0 à 3 correspondent à P1 à P4)
        const gradesMapping = Array(4).fill(0);
        gradesMapping[activePeriod - 1] = student.average || 0;

        await setDoc(gradeDocRef, {
          studentName: student.displayName,
          numPerm: student.numPerm,
          grades: gradesMapping, // Stockage des moyennes par période
          course: selectedCourse,
          class: selectedClass,
          updatedAt: new Date()
        }, { merge: true });
      });

      await Promise.all([...savePromises, ...updatePromises]);
      setToast({ message: "Toutes les données ont été enregistrées", type: 'success' });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement :", error);
      const errMessage = error instanceof Error ? error.message : "Erreur inconnue";
      setToast({ message: errMessage, type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Fonction optimisée pour ne sauvegarder que les moyennes en respectant le mapping des périodes
const handleSaveAverage = async () => {
  if (!schoolUid) {
    setToast({ message: "Erreur: École non identifiée", type: "error" });
    setTimeout(() => setToast(null), 3000);
    return;
  }
  setIsSaving(true);
  try {
    // Mapping : Période 1 → indice 0, Période 2 → indice 1, Période 3 → indice 3, Période 4 → indice 4
    const periodMapping: { [key: number]: number } = { 1: 0, 2: 1, 3: 3, 4: 4 };

    const updatePromises = students.map(async (student) => {
      const gradeDocRef = doc(
        firestore,
        "schools",
        schoolUid,
        "grades",
        `${student.numPerm}_${selectedCourse}`
      );

      // Récupération du document existant ou initialisation d'un tableau de 6 éléments à 0
      const docSnap = await getDoc(gradeDocRef);
      const existingGrades: number[] = docSnap.exists()
        ? docSnap.data().grades || Array(6).fill(0)
        : Array(6).fill(0);

      // On s'assure d'avoir exactement 6 éléments dans le tableau
      const newGrades = [...existingGrades];
      if (newGrades.length < 6) {
        while (newGrades.length < 6) {
          newGrades.push(0);
        }
      } else if (newGrades.length > 6) {
        newGrades.length = 6;
      }

      // Mise à jour de la moyenne de la période active uniquement si elle existe
      if (typeof student.average !== "undefined") {
        newGrades[periodMapping[activePeriod]] = student.average;
      }

      await setDoc(
        gradeDocRef,
        {
          studentName: student.displayName,
          numPerm: student.numPerm,
          grades: newGrades, // Tableau complet des 6 valeurs
          course: selectedCourse,
          class: selectedClass,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    });

    await Promise.all(updatePromises);
    setToast({ message: "Moyennes mises à jour avec succès", type: "success" });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des moyennes :", error);
    const errMessage = error instanceof Error ? error.message : "Erreur inconnue";
    setToast({ message: errMessage, type: "error" });
  } finally {
    setIsSaving(false);
    setTimeout(() => setToast(null), 3000);
  }
};


  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {toast && <Toast message={toast.message} type={toast.type} />}
      <div className="flex flex-col gap-6">
        <Header
          onRetour={onRetour}
          selectedCourse={selectedCourse}
          selectedClass={selectedClass}
          activePeriod={activePeriod}
          isSaving={isSaving}
          isLoading={isLoading}
          handleSave={handleSave}
          handleSaveAverage={handleSaveAverage}
        />
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-56 flex-shrink-0">
            <PeriodNavigation activePeriod={activePeriod} setActivePeriod={setActivePeriod} />
            <Statistics students={students} />
          </div>
          <GradeTable
            students={students}
            numTests={numTests}
            courseMax={getCourseMax()}
            handleGradeChange={handleGradeChange}
            addTest={addTest}
            removeTest={removeTest}
            handleSave={handleSave}
            handleSaveAverage={handleSaveAverage}
          />
        </div>
      </div>
    </div>
  );
}
