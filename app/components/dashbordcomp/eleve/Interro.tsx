"use client";
import React, { useState, useEffect } from 'react';
import { auth, firestore } from '@/config/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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

interface GradeRecord {
  value: number;
  date: Date;
  period: number;
  testNumber: number;
  course: string;
  class: string;
  studentName: string;
  studentId: string;
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

  // Fonction de calcul de la moyenne normalisée sur courseMax
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

        // Pour chaque élève, charger les notes depuis la sous-collection Interro
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

  const handleSave = async () => {
    if (!schoolUid) {
      setToast({ message: "Erreur: École non identifiée", type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setIsSaving(true);
    try {
      // Mapping des périodes vers index
      const periodToIndex: { [key: number]: number } = {1:0, 2:1, 3:3, 4:4};
      const index = periodToIndex[activePeriod] ?? activePeriod;

      // Enregistrement dans la sous-collection Interro
      const savePromises = students.flatMap(student =>
        student.grades.map(async (grade, testNumber) => {
          if (grade > 0) {
            const interroCollectionRef = collection(
              firestore,
              `schools/${schoolUid}/students/${student.uid}/Interro`
            );
            const gradeDocRef = doc(
              interroCollectionRef,
              `${selectedCourse}.period${activePeriod}.test${testNumber}`
            );
            const gradeData: GradeRecord = {
              value: grade,
              date: new Date(),
              period: activePeriod,
              testNumber,
              course: selectedCourse,
              class: selectedClass,
              studentName: student.displayName,
              studentId: student.uid
            };
            await setDoc(gradeDocRef, gradeData, { merge: true });
          }
        })
      );
      await Promise.all(savePromises);

      // Mise à jour des moyennes dans le document élève
      const updatePromises = students.map(async student => {
        const studentRef = doc(firestore, `schools/${schoolUid}/students/${student.uid}`);
        await updateDoc(studentRef, {
          [`grades.${selectedCourse}.${index}`]: {
            average: student.average,
            lastUpdated: new Date()
          }
        });
      });
      await Promise.all(updatePromises);

      setToast({ message: "Toutes les notes ont été enregistrées avec succès", type: 'success' });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement :", error);
      const errMessage = error instanceof Error ? error.message : "Erreur lors de l'enregistrement";
      setToast({ message: errMessage, type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Nouvelle fonction pour sauvegarder uniquement la moyenne en utilisant setDoc avec merge
  const handleSaveAverage = async () => {
    if (!schoolUid) {
      setToast({ message: "Erreur: École non identifiée", type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setIsSaving(true);
    try {
      // Mapping des périodes vers index
      const periodToIndex: { [key: number]: number } = {1:0, 2:1, 3:3, 4:4};
      const index = periodToIndex[activePeriod] ?? activePeriod;

      
      const updatePromises = students.map(async student => {
        const studentRef = doc(firestore, `schools/${schoolUid}/students/${student.uid}`);
        await setDoc(
          studentRef,
          {
            grades: {
              [selectedCourse]: {
                [index]: {
                  average: student.average,
                  lastUpdated: new Date()
                } 
              }
            }
          },
          { merge: true }
        );
      });

      await Promise.all(updatePromises);
      setToast({ message: "Les moyennes ont été enregistrées avec succès", type: 'success' });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des moyennes :", error);
      const errMessage = error instanceof Error ? error.message : "Erreur lors de l'enregistrement des moyennes";
      setToast({ message: errMessage, type: 'error' });
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
