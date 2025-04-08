import React from 'react';
import { User, Edit2, Minus, Plus } from 'lucide-react';

interface Student {
  uid: string;
  displayName: string;
  numPerm: string;
  grades: (number | null)[];
  examGrade?: number | null;
  average?: number;
}

interface GradeTableProps {
  students: Student[];
  numTests: number;
  courseMax: number;
  activePeriod: number; // Période active (1-6)
  handleGradeChange: (studentId: string, testIndex: number, value: string) => void;
  handleExamChange: (studentId: string, value: string) => void;
  addTest: () => void;
  removeTest: () => void;
  handleSaveAverage: () => void;
  handleSave: () => void;
}

export default function GradeTable({ 
  students, 
  numTests,
  courseMax,
  activePeriod,
  handleGradeChange,
  handleExamChange,
  addTest,
  removeTest,
  handleSave,
  handleSaveAverage,
}: GradeTableProps) {
  const calculateAverage = (grades: number[], examGrade?: number): number => {
    const isExamPeriod = activePeriod >= 5;
    const totalTests = isExamPeriod ? 1 : grades.length;
    const sum = isExamPeriod ? (examGrade || 0) : grades.reduce((acc, grade) => acc + grade, 0);
    
    if (totalTests === 0) return 0;
    
    const average = sum / totalTests;
    return Math.min(Math.round(average), courseMax);
  };

  if (students.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        Aucun élève trouvé dans cette classe
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Edit2 className="w-5 h-5 text-blue-500" />
          Notes des élèves
        </h2>
        
        <div className="flex items-center gap-4">
          {activePeriod < 5 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Interros :</span>
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                <button
                  onClick={removeTest}
                  disabled={numTests <= 1}
                  className="p-1 rounded-md text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Supprimer une interrogation"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-6 text-center font-medium">{numTests}</span>
                <button
                  onClick={addTest}
                  className="p-1 rounded-md text-gray-600 hover:bg-gray-200 transition-colors"
                  aria-label="Ajouter une interrogation"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Élève
              </th>
              {/* Colonnes d'interro pour périodes normales */}
              {activePeriod < 5 && Array.from({ length: numTests }).map((_, index) => (
                <th key={index} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interro {index + 1}
                </th>
              ))}
              {/* Colonne examen pour périodes 5-6 */}
              {activePeriod >= 5 && (
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50">
                  Examen
                </th>
              )}
              {/* La colonne Moyenne est affichée seulement pour les périodes non examens */}
              {activePeriod < 5 && (
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Moyenne
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map(student => {
              const grades = student.grades.slice(0, numTests);
              const average = typeof student.average !== 'undefined'
                ? student.average
                : calculateAverage(grades.filter((grade): grade is number => grade !== null), student.examGrade ?? undefined);
              
              return (
                <tr key={student.uid} className="hover:bg-gray-50 transition-colors">
                  {/* Colonne élève */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 uppercase">{student.displayName}</div>
                        <div className="text-xs text-gray-500">ID: {student.numPerm}</div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Colonnes d'interro */}
                  {activePeriod < 5 && Array.from({ length: numTests }).map((_, index) => (
                    <td key={index} className="px-4 py-3 whitespace-nowrap text-center">
                      <input
                        type="text"
                        value={student.grades[index] ?? ''}
                        onChange={(e) => handleGradeChange(student.uid, index, e.target.value)}
                        className="w-16 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-sm transition-all"
                      />
                    </td>
                  ))}
                  
                  {/* Colonne examen */}
                  {activePeriod >= 5 && (
                    <td className="px-4 py-3 whitespace-nowrap text-center bg-yellow-50">
                     <input
                        type="text"
                        value={student.examGrade ?? ''}
                        onChange={(e) => handleExamChange(student.uid, e.target.value)}
                        className="w-16 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-center text-sm transition-all"
                      />
                    </td>
                  )}
                  
                  {/* Colonne moyenne : uniquement affichée si période normale */}
                  {activePeriod < 5 && (
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        average >= courseMax / 2
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {average} / {courseMax}
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 pb-10 flex flex-wrap items-center justify-end gap-4 text-xs text-gray-500">
        {activePeriod < 5 && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></div>
              <span>Moyenne ≥ {courseMax / 2}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></div>
              <span>Moyenne &AL; {courseMax / 2}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
