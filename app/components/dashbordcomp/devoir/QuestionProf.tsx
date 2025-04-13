import React from 'react';
import { Question } from './DevoirProf';

interface QuestionResponseProps {
  question: Question;
  answer: string;
}

const QuestionResponse: React.FC<QuestionResponseProps> = ({ question, answer }) => {
  const answeredOption = question.type === 'qcm' && question.options
    ? question.options.find(option => option.id.toString() === answer)
    : null;

  return (
    <article className="p-5 bg-gray-50 rounded-lg border border-gray-200">
      <header className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-800">Question {question.numero}</h3>
        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
          {question.type === 'qcm' ? 'QCM' : 'Réponse libre'} • {question.points} point{question.points > 1 ? 's' : ''}
        </span>
      </header>

      <p className="text-gray-800 mb-4">{question.enonce}</p>

      {question.type === 'qcm' && question.options && (
        <ul className="space-y-2 mb-4">
          {question.options.map((option) => (
            <li 
              key={option.id} 
              className={`pl-3 py-2 rounded border ${
                option.correcte
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-white'
              } ${
                answeredOption?.id === option.id ? 'ring-2 ring-blue-300' : ''
              }`}
            >
              <div className="flex items-center">
                <span className={`inline-block w-4 h-4 rounded-full mr-2 ${
                  option.correcte ? 'bg-green-500' : 'bg-gray-300'
                }`}></span>
                <span>{option.texte}</span>
                {option.correcte && (
                  <span className="ml-auto text-xs text-green-600 font-medium">Bonne réponse</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
};

export default QuestionResponse;