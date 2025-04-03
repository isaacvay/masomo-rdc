"use client";
import React, { useState, useEffect } from 'react';
import { auth, firestore } from '@/config/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import GradeTable from './interro/GradeTable';
import Header from './interro/Header';
import PeriodNavigation from './interro/PeriodNavigation';
import Statistics from './interro/Statistics';
import Toast from './interro/Toast';
import {sections } from '@/data/cours'; // Assurez-vous que le chemin est correct

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
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Fonction pour retrouver le maximum d'une épreuve pour le cours sélectionné
  const getCourseMax = (): number => {
    // On parcourt les sections pour trouver celle qui concerne la classe sélectionnée
    for (const section of sections) {
      if (section.classe.includes(selectedClass)) {
        const course = section.subjects.find(subject => subject.name === selectedCourse);
        if (course) {
          return course.maxima[0];
        }
      }
    }
    // Valeur par défaut si le cours n'est pas trouvé
    return 20;
  };

  // Fonction de calcul de la moyenne normalisée sur 20
  const calculateAverage = (grades: number[]): number => {
    const courseMax = getCourseMax();
    if (grades.length === 0) return 0;
    const totalObtained = grades.reduce((a, b) => a + b, 0);
    const totalPossible = grades.length * courseMax;
    const normalized = (totalObtained / totalPossible) * 20;
    return parseFloat(normalized.toFixed(1));
  };

  // Récupération du schoolUid
  useEffect(() => {
    const loadSchoolUid = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setToast({message: "Aucun utilisateur connecté", type: 'error'});
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
        setToast({message: "Erreur lors de la récupération des informations de l'école", type: 'error'});
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
        // 1. Charger les élèves de la classe
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

        // 2. Pour chaque élève, charger les notes depuis la sous-collection Interro
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
        setToast({message: "Erreur lors du chargement des données", type: 'error'});
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
      setToast({message: "Erreur: École non identifiée", type: 'error'});
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setIsSaving(true);
    try {
      // Vérifier les permissions avant de sauvegarder
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Utilisateur non connecté");
      }

      const userDoc = await getDoc(doc(firestore, "users", currentUser.uid));
      const userData = userDoc.data();
      
      if (!userData || (userData.role !== "professeur" && currentUser.uid !== schoolUid)) {
        throw new Error("Permissions insuffisantes pour sauvegarder les notes");
      }

      // Enregistrement dans la sous-collection Interro
      const savePromises = students.flatMap(student => 
        student.grades.map(async (grade, testNumber) => {
          if (grade > 0) {
            const gradeDocRef = doc(
              firestore,
              `schools/${schoolUid}/students/${student.uid}/Interro`,
              `${selectedCourse}_P${activePeriod}_T${testNumber}`
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
      
      // Mettre à jour les moyennes dans le document élève
      const updatePromises = students.map(async student => {
        const studentRef = doc(firestore, `schools/${schoolUid}/students/${student.uid}`);
        await updateDoc(studentRef, {
          [`grades.${selectedCourse}.period${activePeriod}`]: {
            average: student.average,
            lastUpdated: new Date()
          }
        });
      });

      await Promise.all(updatePromises);
      
      setToast({message: "Toutes les notes ont été enregistrées avec succès", type: 'success'});
    } catch (error) {
      console.error("Erreur lors de l'enregistrement :", error);
      const errMessage = error instanceof Error ? error.message : "Erreur lors de l'enregistrement";
      setToast({message: errMessage, type: 'error'});
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
          />
        </div>
      </div>
    </div>
  );
}
