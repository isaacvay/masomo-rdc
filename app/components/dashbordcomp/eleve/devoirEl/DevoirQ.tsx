import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '@/config/firebase';

export interface OptionQCM {
  id: number;
  texte: string;
  correcte: boolean;
}

// Utilisation de l'interface Question avec la propriété "points"
export interface Question {
  id: number;
  numero: number;
  enonce: string;
  type: 'texte' | 'qcm';
  points: number;
  options?: OptionQCM[];
}

interface DevoirQProps {
  devoir: {
    id: string;
    titre: string;
    date: string;
    matiere: string;
    points: number;
    statut: string;
    hasSubmitted?: boolean;
    questions: Question[];
  };
  onBack: () => void;
  schoolId: string | null;
  initialReponses: Record<number, string>;
}

export default function DevoirQ({ devoir, onBack, initialReponses, schoolId }: DevoirQProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reponses, setReponses] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Initialisation des réponses avec une valeur par défaut (chaine vide)
  useEffect(() => {
    const initialReponsesState = devoir.questions.reduce((acc, q) => {
      return { ...acc, [q.id]: initialReponses[q.id] || '' };
    }, {});
    setReponses(initialReponsesState);
  }, [devoir, initialReponses]);

  const handleReponseChange = (questionId: number, value: string) => {
    setReponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < devoir.questions.length) {
      setCurrentIndex(index);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    // Vérifier que toutes les questions ont une réponse
    const unanswered = devoir.questions.filter(
      (q) =>
        (!reponses[q.id]?.trim() && q.type === 'texte') ||
        (q.type === 'qcm' && reponses[q.id] === '')
    );
    if (unanswered.length > 0) {
      setError(`Veuillez répondre à toutes les questions (${unanswered.length} restantes)`);
      return;
    }
  
    try {
      if (!schoolId) {
        throw new Error("School ID not available");
      }
  
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }
  
      // Sauvegarder les réponses dans Firestore
      const reponsesRef = collection(
        firestore,
        'schools',
        schoolId,
        'devoirs',
        devoir.id,
        'reponses'
      );
  
      await addDoc(reponsesRef, {
        studentId: user.uid,
        reponses: reponses,
        submittedAt: serverTimestamp(),
        isLate: isLate,
        matiere: devoir.matiere,
        devoirTitle: devoir.titre,
      });
  
      alert('Devoir soumis avec succès!');
      onBack();
    } catch (error) {
      console.error("Erreur lors de la soumission du devoir:", error);
      setError("Une erreur est survenue lors de la soumission du devoir.");
    }
  };

  const currentDate = new Date();
  const devoirDate = new Date(devoir.date);
  const isLate = currentDate > devoirDate;
  const hasSubmitted = devoir.hasSubmitted || false;
  const currentQuestion = devoir.questions[currentIndex];

  const renderLateSubmissionAlert = () => {
    return (
      <div className="mx-6 mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Date limite dépassée</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                La date de remise est passée. Vous pouvez toujours soumettre votre travail, 
                mais il sera marqué comme étant en retard.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSubmitButton = () => {
    if (currentIndex === devoir.questions.length - 1) {
      if (isLate && !hasSubmitted) {
        return (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Soumettre (en retard)
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        );
      }
      return (
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Soumettre
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        Retour aux devoirs
      </button>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{devoir.titre}</h1>
              <p className="text-indigo-600 font-medium">{devoir.matiere}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {devoir.date}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  hasSubmitted
                    ? 'bg-green-100 text-green-800'
                    : isLate
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {hasSubmitted ? 'Rendu' : isLate ? 'En retard' : 'À rendre'}
              </span>
            </div>
          </div>
        </div>
        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}
        {/* Late Submission Alert */}
        {isLate && !hasSubmitted && renderLateSubmissionAlert()}
        {/* Question Display */}
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 p-6">
            <div className="mb-6 p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-blue-600">
                      Question {currentQuestion.numero}
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {currentQuestion.type === 'qcm' ? 'Choix multiple' : 'Réponse libre'}
                    </span>
                    {/* Affichage des points par question */}
                    <span className="text-sm text-black font-semibold italic">
                     ( {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''} )
                    </span>
                  </div>
                  <p className="mt-2 text-gray-700">{currentQuestion.enonce}</p>
                </div>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {currentIndex + 1}/{devoir.questions.length}
                </span>
              </div>
              {currentQuestion.type === 'texte' ? (
                <textarea
                  value={reponses[currentQuestion.id] || ''}
                  onChange={(e) =>
                    handleReponseChange(currentQuestion.id, e.target.value)
                  }
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={6}
                  placeholder="Écrivez votre réponse ici..."
                />
              ) : (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                        reponses[currentQuestion.id] === option.id.toString()
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option.id}
                        checked={
                          reponses[currentQuestion.id] === option.id.toString()
                        }
                        onChange={() =>
                          handleReponseChange(
                            currentQuestion.id,
                            option.id.toString()
                          )
                        }
                        className="mt-1 mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="flex-1">{option.texte}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => goToQuestion(currentIndex - 1)}
                disabled={currentIndex === 0}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg ${
                  currentIndex === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Précédent
              </button>
              {currentIndex < devoir.questions.length - 1 ? (
                <button
                  onClick={() => goToQuestion(currentIndex + 1)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Suivant
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              ) : (
                renderSubmitButton()
              )}
            </div>
          </div>
          {/* Sidebar de navigation : liste des questions */}
          <div className="lg:w-48 p-4 bg-gray-50 border-l">
            <h2 className="font-bold text-sm mb-3 text-gray-700 uppercase tracking-wider">
              Questions
            </h2>
            <div className="space-y-2">
              {devoir.questions.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(index)}
                  className={`w-full flex items-center justify-between p-2 rounded-md text-sm transition-colors ${
                    index === currentIndex
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : reponses[q.id]?.trim() || (q.type === 'qcm' && reponses[q.id] !== '')
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>Question {q.numero}</span>
                  {(reponses[q.id]?.trim() || (q.type === 'qcm' && reponses[q.id] !== '')) && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
