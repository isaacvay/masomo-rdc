"use client";
import React, { useState, useEffect } from 'react';
import { auth, firestore } from '@/config/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import GradeTable from './interro/GradeTable';
import Header from './interro/Header';
import PeriodNavigation from './interro/PeriodNavigation';
import Statistics from './interro/Statistics';
import Toast from './interro/Toast';
import { sections } from '@/data/cours';

// On modifie le type pour permettre null pour les notes
interface Student {
  uid: string;
  displayName: string;
  numPerm: string;
  grades: (number | null)[];
  examGrade?: number | null;
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
  // Par défaut on affiche 1 interro
  const [numTests, setNumTests] = useState<number>(1);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [schoolUid, setSchoolUid] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Pour les tests : maxima défini à l'index 0
  const getTestMax = (): number => {
    for (const section of sections) {
      if (section.classe.includes(selectedClass)) {
        const course = section.subjects.find(subject => subject.name === selectedCourse);
        return course?.maxima[0] || 20;
      }
    }
    return 20;
  };

  // Pour les examens : maxima défini à l'index 2
  const getExamMax = (): number => {
    for (const section of sections) {
      if (section.classe.includes(selectedClass)) {
        const course = section.subjects.find(subject => subject.name === selectedCourse);
        return course?.maxima[2] || 20;
      }
    }
    return 20;
  };

  // Calcule la moyenne en prenant en compte uniquement les notes non nulles
  const calculateAverage = (grades: (number | null)[], examGrade?: number | null): number => {
    if (activePeriod >= 5) {
      const examMax = getExamMax();
      // Si aucune note d'examen n'est saisie, on retourne 0
      return examGrade !== null && examGrade !== undefined
        ? Math.min(Math.round(examGrade), examMax)
        : 0;
    } else {
      const testMax = getTestMax();
      const validGrades = grades.filter(g => g !== null) as number[];
      if (validGrades.length === 0) return 0;
      const sum = validGrades.reduce((acc, grade) => acc + grade, 0);
      const average = sum / validGrades.length;
      return Math.min(Math.round(average), testMax);
    }
  };

  useEffect(() => {
    const loadSchoolUid = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      try {
        const q = query(collection(firestore, "users"), where("email", "==", currentUser.email));
        const snapshot = await getDocs(q);
        const userData = snapshot.docs[0]?.data();
        setSchoolUid(userData?.schoolId || currentUser.uid);
      } catch (error) {
        console.error("Erreur lors de la récupération de l'école :", error);
        setToast({ message: "Erreur lors de la récupération des informations de l'école", type: 'error' });
        setTimeout(() => setToast(null), 3000);
      }
    };
    loadSchoolUid();
  }, []);

  useEffect(() => {
    const loadStudentsAndGrades = async () => {
      if (!schoolUid) return;
      setIsLoading(true);
      try {
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
        
        const studentsWithGradesTemp = await Promise.all(
          studentsData.map(async (student) => {
            try {
              const interroRef = collection(
                firestore,
                `schools/${schoolUid}/students/${student.uid}/Interro`
              );
              const q = query(interroRef, where("course", "==", selectedCourse));
              const snapshot = await getDocs(q);

              let maxTestIndex = -1;
              let tests: { index: number; value: number }[] = [];
              let examGrade: number | null = null;
              
              snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const period = data.period;
                const testNumber = data.testNumber;
                // On prend en compte uniquement les tests dont une valeur non null est saisie
                if (
                  typeof testNumber === 'number' &&
                  period === activePeriod &&
                  testNumber >= 0 &&
                  data.value !== null &&
                  typeof data.value !== 'undefined'
                ) {
                  maxTestIndex = Math.max(maxTestIndex, testNumber);
                  tests.push({ index: testNumber, value: data.value });
                }
                // Pour les examens (périodes 5 et 6)
                else if (testNumber === 'exam') {
                  if (activePeriod === 5 && period === 5) {
                    examGrade = data.value;
                  } else if (activePeriod === 6 && period === 6) {
                    examGrade = data.value;
                  }
                }
              });
              
              const testCount = maxTestIndex === -1 ? 1 : maxTestIndex + 1;
              let grades: (number | null)[] = Array(testCount).fill(null);
              tests.forEach(({ index, value }) => {
                grades[index] = value;
              });
              
              return {
                ...student,
                grades,
                examGrade,
                average: calculateAverage(grades, examGrade)
              };
            } catch (error) {
              console.error(`Erreur pour ${student.displayName}:`, error);
              return { ...student, grades: [null], average: 0 };
            }
          })
        );
        
        let calculatedNumTests = 1;
        studentsWithGradesTemp.forEach(student => {
          calculatedNumTests = Math.max(calculatedNumTests, student.grades.length);
        });

        const studentsWithGrades = studentsWithGradesTemp.map(student => ({
          ...student,
          grades: student.grades.length < calculatedNumTests 
            ? [...student.grades, ...Array(calculatedNumTests - student.grades.length).fill(null)]
            : student.grades,
          average: calculateAverage(student.grades, student.examGrade)
        }));
        setNumTests(calculatedNumTests);
        setStudents(studentsWithGrades);
      } catch (error) {
        console.error("Erreur de chargement :", error);
        setToast({ message: "Erreur lors du chargement des données", type: 'error' });
        setTimeout(() => setToast(null), 3000);
      } finally {
        setIsLoading(false);
      }
    };
    if (schoolUid) loadStudentsAndGrades();
  }, [schoolUid, selectedClass, selectedCourse, activePeriod]);

  // Mise à jour de la note de test : on conserve null si l'input est vide
  const handleGradeChange = (studentId: string, testIndex: number, value: string) => {
    // Si la saisie est vide, on enregistre null
    const newGrade = value === '' ? null : Math.min(getTestMax(), Math.max(0, parseFloat(value)));
    setStudents(students.map(student => 
      student.uid === studentId ? {
        ...student,
        grades: [
          ...student.grades.slice(0, testIndex),
          newGrade,
          ...student.grades.slice(testIndex + 1)
        ],
        average: calculateAverage(
          [...student.grades.slice(0, testIndex), newGrade, ...student.grades.slice(testIndex + 1)],
          student.examGrade
        )
      } : student
    ));
  };

  // Mise à jour de l'examen : pareil, on conserve null si rien n'est saisi
  const handleExamChange = (studentId: string, value: string) => {
    const newExamGrade = value === '' ? null : Math.min(getExamMax(), Math.max(0, parseFloat(value)));
    setStudents(students.map(student => 
      student.uid === studentId ? {
        ...student,
        examGrade: newExamGrade,
        average: calculateAverage(student.grades, newExamGrade)
      } : student
    ));
  };

  const addTest = () => {
    setNumTests(prev => prev + 1);
    setStudents(students.map(student => ({
      ...student,
      grades: [...student.grades, null],
      average: calculateAverage([...student.grades, null], student.examGrade)
    })));
  };

  const removeTest = () => {
    if (numTests > 1) {
      setNumTests(prev => prev - 1);
      setStudents(students.map(student => ({
        ...student,
        grades: student.grades.slice(0, -1),
        average: calculateAverage(student.grades.slice(0, -1), student.examGrade)
      })));
    }
  };

  // Lors de la sauvegarde, on n'enregistre que les tests dont la valeur n'est pas null
  const handleSave = async () => {
    if (!schoolUid) {
      setToast({ message: "École non identifiée", type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setIsSaving(true);
    try {
      const interroPromises = students.flatMap(student => {
        const interroCollectionRef = collection(
          firestore,
          `schools/${schoolUid}/students/${student.uid}/Interro`
        );
        const testPromises = student.grades.map((grade, index) => {
          // N'enregistre le test que si une note a été saisie
          if (grade !== null) {
            return setDoc(
              doc(interroCollectionRef, `${selectedCourse}.period${activePeriod}.test${index}`),
              {
                value: grade,
                date: new Date(),
                period: activePeriod,
                testNumber: index,
                course: selectedCourse,
                class: selectedClass,
                studentName: student.displayName,
                studentId: student.uid
              },
              { merge: true }
            );
          } else {
            return null;
          }
        }).filter(Boolean);
        // Sauvegarde de la note d'examen (uniquement si une valeur est saisie)
        const examPromise =
          student.examGrade !== null &&
          (activePeriod === 5 || activePeriod === 6) &&
          setDoc(
            doc(interroCollectionRef, `${selectedCourse}.period${activePeriod}.exam`),
            {
              value: student.examGrade,
              date: new Date(),
              period: activePeriod,
              testNumber: 'exam',
              course: selectedCourse,
              class: selectedClass,
              studentName: student.displayName,
              studentId: student.uid
            },
            { merge: true }
          );
        return [...testPromises, examPromise].filter(Boolean);
      });
      await Promise.all(interroPromises);
      setToast({ message: "Données sauvegardées", type: 'success' });
    } catch (error) {
      console.error("Erreur de sauvegarde :", error);
      setToast({ message: "Erreur lors de la sauvegarde", type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  // handleSaveAverage reste inchangé dans cette partie
  const handleSaveAverage = async () => {
    // ... code inchangé pour la mise à jour des moyennes ...
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
            courseMax={activePeriod >= 5 ? getExamMax() : getTestMax()}
            activePeriod={activePeriod}
            handleGradeChange={handleGradeChange}
            handleExamChange={handleExamChange}
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
