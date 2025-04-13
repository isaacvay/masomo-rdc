"use client";
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { Devoir } from './DevoirProf';
import StudentItem from './AccordionQuestions';

interface DevoirProfCorrectionProps {
  devoir: Devoir;
  schoolId: string;
  onBack: () => void;
}

const DevoirProfCorrection: React.FC<DevoirProfCorrectionProps> = ({ devoir, schoolId, onBack }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch students
        const studentsQuery = query(
          collection(firestore, 'users'),
          where('role', '==', 'élève'),
          where('schoolId', '==', schoolId),
          where('classe', '==', devoir.classe)
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentsData = studentsSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        }));

        // Fetch responses
        const responsesQuery = collection(firestore, 'schools', schoolId, 'devoirs', devoir.id, 'reponses');
        const responsesSnapshot = await getDocs(responsesQuery);
        const responsesData = responsesSnapshot.docs.reduce((acc, doc) => {
          const data = doc.data();
          acc[data.studentId] = { ...data, docId: doc.id };
          return acc;
        }, {} as Record<string, any>);

        setStudents(studentsData);
        setResponses(responsesData);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Une erreur est survenue lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [devoir, schoolId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Corrections</h1>
          <h2 className="text-lg text-gray-600">{devoir.titre}</h2>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50"
        >
          Retour au devoir
        </button>
      </div>

      {students.length === 0 ? (
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <p className="text-gray-500">Aucun élève dans cette classe</p>
        </div>
      ) : (
        <div className="space-y-4">
          {students.map(student => (
            <StudentItem 
              key={student.uid} 
              student={student}
              studentResponse={responses[student.uid]}
              devoir={devoir}
              schoolId={schoolId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DevoirProfCorrection;