import React from 'react';
import { Devoir } from './DevoirProf';
import QuestionProf from './QuestionProf';
import { formatDate } from './utils';


const statusClasses = {
  "À rendre": "bg-amber-100 text-amber-800",
  "Rendu": "bg-green-100 text-green-800",
  "default": "bg-red-100 text-red-800"
};

interface DevoirProfDetailProps {
  devoir: Devoir;
  onBack: () => void;
  onShowCorrection: () => void;
  onEdit: () => void; // Callback pour passer en mode édition
}



const DevoirProfDetail: React.FC<DevoirProfDetailProps> = ({ devoir, onBack, onShowCorrection, onEdit }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      <div className="my-2 px-4 flex flex-wrap justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Retour à la liste
          </button>
          <button
            onClick={onEdit}
            className="px-5 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors shadow-sm"
          >
            Modifier le devoir
          </button>
        </div>
        <button
          onClick={onShowCorrection}
          className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
        >
          Voir les corrections
        </button>
      </div>
      <header className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{devoir.titre}</h1>
            <p className="text-indigo-700 font-medium">{devoir.matiere}</p>
          </div>
          <div className="flex items-center gap-3">
            <time className="text-sm text-gray-600">{formatDate(devoir.date)}</time>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              statusClasses[devoir.statut as keyof typeof statusClasses] || statusClasses.default
            }`}>
              {devoir.statut}
            </span>
          </div>
        </div>
      </header>

      <section className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Questions</h2>
        <div className="space-y-5">
          {devoir.questions.map((question) => (
            <QuestionProf 
              key={question.id} 
              question={question} 
              answer={''} 
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default DevoirProfDetail;
