"use client";
import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { Devoir } from './DevoirProf';

interface StudentItemProps {
  student: any;
  studentResponse?: any;
  devoir: Devoir;
  schoolId: string;
}

const StudentItem: React.FC<StudentItemProps> = ({ student, studentResponse, devoir, schoolId }) => {
  const [isOpen, setIsOpen] = useState(false);
  // corrections représente la note saisie manuellement par le professeur (uniquement pour les questions texte)
  const [corrections, setCorrections] = useState<Record<string, number>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [savedScore, setSavedScore] = useState<number | null>(null);
  const [savedCorrections, setSavedCorrections] = useState<Record<string, number> | null>(null);

  const toggleAccordion = () => setIsOpen(!isOpen);

  const handleCorrectionChange = (questionId: string, value: string) => {
    const questionPoints = devoir.questions.find(q => q.id === questionId)?.points || 0;
    const score = Math.max(0, Math.min(parseFloat(value) || 0, questionPoints));
    setCorrections(prev => ({ ...prev, [questionId]: score }));
  };

  // Calcule le score total et les scores par question.
  // Pour QCM : si une correction manuelle n'est pas définie, on applique la note automatique (points si réponse correcte, zéro sinon).
  // Pour texte : on prend uniquement la saisie manuelle.
  const calculateScores = () => {
    let total = 0;
    const questionScores: Record<string, number> = {};

    devoir.questions.forEach(question => {
      let autoScore = 0;
      const teacherScore = corrections[question.id];
      
      if (question.type === 'qcm') {
        if (studentResponse?.reponses[question.id]) {
          const answeredOption = question.options?.find(
            opt => opt.id.toString() === studentResponse.reponses[question.id]
          );
          autoScore = answeredOption?.correcte ? question.points : 0;
        }
        // La note affichée pour un QCM est toujours automatique.
        questionScores[question.id] = autoScore;
        total += autoScore;
      } else if (question.type === 'texte') {
        const score = teacherScore !== undefined ? teacherScore : 0;
        questionScores[question.id] = score;
        total += score;
      }
    });

    return { total, questionScores };
  };

  const { total, questionScores } = calculateScores();
  const maxScore = devoir.questions.reduce((sum, q) => sum + q.points, 0);

  // Récupère les scores sauvegardés depuis Firestore, s'ils existent.
  useEffect(() => {
    const fetchScore = async () => {
      if (studentResponse?.docId) {
        const docRef = doc(
          firestore,
          'schools',
          schoolId,
          'devoirs',
          devoir.id,
          'reponses',
          studentResponse.docId
        );
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setSavedScore(data.totalScore);
            setSavedCorrections(data.corrections || {});
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du score :", error);
        }
      }
    };

    fetchScore();
  }, [studentResponse, schoolId, devoir.id]);

  // Enregistre le score et les corrections dans Firestore.
  const saveScore = async () => {
    if (!studentResponse?.docId) return;
    
    setSaveStatus('loading');
    try {
      const docRef = doc(firestore, 'schools', schoolId, 'devoirs', devoir.id, 'reponses', studentResponse.docId);
      await updateDoc(docRef, { 
        totalScore: total,
        corrections: questionScores
      });
      setSaveStatus('success');
      setSavedScore(total);
      setSavedCorrections(questionScores);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du score :", error);
      setSaveStatus('error');
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div 
        onClick={toggleAccordion}
        className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            studentResponse ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
          <div>
            <h3 className="font-medium text-gray-900">
              {student.displayName || student.email}
            </h3>
            <p className="text-sm text-gray-500">{student.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {studentResponse && (
            <span className="text-sm font-medium">
              {savedScore !== null ? savedScore : total} / {maxScore} pts
            </span>
          )}
          <svg 
            className={`w-5 h-5 text-gray-400 transform transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-gray-200 p-4">
          {studentResponse ? (
            <>
              <div className="space-y-5 mb-6">
                {devoir.questions.map(question => (
                  <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-800">
                        Question {question.numero}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {question.type === 'qcm'
                          ? `${questionScores[question.id]} / ${question.points} pts`
                          : (savedCorrections && savedCorrections[question.id] !== undefined
                                ? `${savedCorrections[question.id]}`
                                : `${questionScores[question.id]}`) + ` / ${question.points} pts`
                        }
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{question.enonce}</p>
                    
                    {question.type === 'qcm' && question.options && (
                      <ul className="space-y-2 mb-4">
                        {question.options.map(opt => (
                          <li
                            key={opt.id}
                            className={`p-2 rounded border ${
                              opt.correcte
                                ? 'border-green-200 bg-green-50'
                                : 'border-gray-200 bg-white'
                            } ${
                              studentResponse.reponses[question.id] === opt.id.toString()
                                ? 'ring-2 ring-blue-300'
                                : ''
                            }`}
                          >
                            <div className="flex items-center">
                              <span className={`inline-block w-4 h-4 rounded-full mr-2 ${
                                opt.correcte ? 'bg-green-500' : 'bg-gray-300'
                              }`}></span>
                              <span>{opt.texte}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    <div className="pt-3 border-t border-gray-200">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Réponse :</h5>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        {question.type === 'qcm'
                          ? question.options?.find(opt => 
                              opt.id.toString() === studentResponse.reponses[question.id]
                            )?.texte || <span className="text-gray-400">Aucune réponse</span>
                          : studentResponse.reponses[question.id] || <span className="text-gray-400">Aucune réponse</span>}
                      </div>
                    </div>
                    
                    {question.type === 'texte' ? (
                      <div className="mt-4 flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Note :</label>
                        <input
                          type="number"
                          className="w-20 p-1 border border-gray-300 rounded text-center"
                          value={
                            (savedCorrections && savedCorrections[question.id] !== undefined)
                              ? savedCorrections[question.id]
                              : (corrections[question.id] ?? '')
                          }
                          onChange={(e) => handleCorrectionChange(question.id, e.target.value)}
                          min="0"
                          max={question.points}
                          step="0.5"
                        />
                        <span className="text-sm text-gray-500">/ {question.points}</span>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <span className="text-sm text-gray-700 font-medium">
                          {questionScores[question.id]} / {question.points} pts
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center border-t border-gray-200 pt-4">
                <div className="font-medium">
                  Total: <span className="text-blue-600">
                    {savedScore !== null ? savedScore : total}
                  </span> / {maxScore} points
                </div>
                <button
                  onClick={saveScore}
                  disabled={saveStatus === 'loading'}
                  className={`px-4 py-2 rounded-lg text-white ${
                    saveStatus === 'loading'
                      ? 'bg-blue-400'
                      : saveStatus === 'success'
                      ? 'bg-green-500'
                      : saveStatus === 'error'
                      ? 'bg-red-500'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } transition-colors`}
                >
                  {saveStatus === 'loading'
                    ? 'Enregistrement...'
                    : saveStatus === 'success'
                      ? 'Enregistré !'
                      : saveStatus === 'error'
                        ? 'Erreur'
                        : 'Enregistrer'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Cet élève n'a pas soumis ce devoir
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentItem;
