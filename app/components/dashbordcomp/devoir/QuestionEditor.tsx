// QuestionEditor.tsx
import React from 'react';
import { PlusIcon, TrashIcon } from './Icons';
import { QuestionEditorProps } from './types';

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  index,
  onUpdate,
  onRemove,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}) => {
  const handleTypeChange = (type: 'texte' | 'qcm') => {
    onUpdate(question.id, 'type', type);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>  
          Question{" "}
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-medium mr-2">
            {index + 1}
          </span>
          {question.type === 'qcm' && (
            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
              QCM
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onRemove(question.id)}
          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          aria-label="Supprimer la question"
        >
          <TrashIcon />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Énoncé <span className="text-red-500">*</span>
          </label>
          <textarea
            value={question.enonce}
            onChange={(e) => onUpdate(question.id, 'enonce', e.target.value)}
            placeholder="Écrivez l'énoncé de la question..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de réponse
            </label>
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => handleTypeChange('texte')}
                className={`px-4 py-2 text-sm font-medium border rounded-l-lg focus:z-10 focus:outline-none ${
                  question.type === 'texte'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Réponse libre
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('qcm')}
                className={`px-4 py-2 text-sm font-medium border rounded-r-lg focus:z-10 focus:outline-none ${
                  question.type === 'qcm'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Choix multiple
                </span>
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points
            </label>
            <div className="relative rounded-md shadow-sm w-24">
              <input
                type="number"
                min="1"
                value={question.points || 1}
                onChange={(e) => onUpdate(question.id, 'points', parseInt(e.target.value) || 1)}
                className="block w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 text-sm">pts</span>
              </div>
            </div>
          </div>
        </div>

        {question.type === 'qcm' && (
          <div className="mt-5">
            <div className="flex justify-between items-center mb-3">
              <h5 className="text-sm font-medium text-gray-700">
                Options QCM <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-1">(minimum 2)</span>
              </h5>
              <button
                type="button"
                onClick={() => onAddOption(question.id)}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <PlusIcon size="sm" />
                Ajouter une option
              </button>
            </div>

            {(!question.options || question.options.length === 0) ? (
              <div className="text-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 text-sm">Aucune option ajoutée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {question.options.map((option, optIndex) => (
                  <div key={option.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center h-10">
                      <input
                        type="checkbox"
                        checked={option.correcte}
                        onChange={(e) => onUpdateOption(question.id, option.id, 'correcte', e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </div>
                    <input
                      type="text"
                      value={option.texte}
                      onChange={(e) => onUpdateOption(question.id, option.id, 'texte', e.target.value)}
                      placeholder={`Option ${optIndex + 1}`}
                      className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => onRemoveOption(question.id, option.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                      aria-label="Supprimer l'option"
                      disabled={(question.options?.length ?? 0) <= 2}
                    >
                      <TrashIcon size="sm" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionEditor;
