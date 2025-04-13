// DevoirProfForm.tsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Devoir, OptionQCM, Question } from './DevoirProf';
import QuestionEditor from './QuestionEditor';
import { PlusIcon, TrashIcon } from './Icons';
import { convertDateToISO, convertAndFormatDate, extractDatePart, extractTimePart } from './utils';
import { DevoirProfFormProps } from './types';

const DevoirProfForm: React.FC<DevoirProfFormProps> = ({ 
  cours, 
  classe, 
  initialData,
  onSubmit, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    titre: initialData?.titre || '',
    date: initialData?.date ? extractDatePart(initialData.date) : '',
    questions: initialData?.questions || [] as Question[],
  });
  
  const [time, setTime] = useState<string>(initialData?.date ? extractTimePart(initialData.date) : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      console.log("Initial data date:", initialData.date);
      setFormData({
        titre: initialData.titre,
        date: initialData.date ? extractDatePart(initialData.date) : '',
        questions: initialData.questions
      });
      setTime(initialData.date ? extractTimePart(initialData.date) : '');
    }
  }, [initialData]);

  const handleChange = useCallback((field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const addQuestion = useCallback(() => {
    const nouvelleQuestion: Question = {
      id: uuidv4(),
      numero: formData.questions.length + 1,
      enonce: '',
      type: 'texte',
      points: 1,
      options: []
    };
    handleChange('questions', [...formData.questions, nouvelleQuestion]);
  }, [formData.questions, handleChange]);

  const updateQuestion = useCallback((questionId: string, field: keyof Question, value: any) => {
    handleChange('questions', formData.questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ));
  }, [formData.questions, handleChange]);

  const removeQuestion = useCallback((questionId: string) => {
    handleChange('questions', formData.questions.filter(q => q.id !== questionId));
  }, [formData.questions, handleChange]);

  const addOption = useCallback((questionId: string) => {
    handleChange('questions', formData.questions.map(q => {
      if (q.id === questionId) {
        const newOption: OptionQCM = {
          id: uuidv4(),
          texte: '',
          correcte: false
        };
        return { 
          ...q, 
          options: [...(q.options || []), newOption] 
        };
      }
      return q;
    }));
  }, [formData.questions, handleChange]);

  const updateOption = useCallback((
    questionId: string, 
    optionId: string, 
    field: keyof OptionQCM, 
    value: string | boolean
  ) => {
    handleChange('questions', formData.questions.map(q => {
      if (q.id === questionId && q.options) {
        return {
          ...q,
          options: q.options.map(opt => 
            opt.id === optionId ? { ...opt, [field]: value } : opt
          )
        };
      }
      return q;
    }));
  }, [formData.questions, handleChange]);

  const removeOption = useCallback((questionId: string, optionId: string) => {
    handleChange('questions', formData.questions.map(q => {
      if (q.id === questionId && q.options) {
        return {
          ...q,
          options: q.options.filter(opt => opt.id !== optionId)
        };
      }
      return q;
    }));
  }, [formData.questions, handleChange]);

  const isFormValid = useMemo(() => {
    if (!formData.titre.trim()) return false;
    if (!formData.date) return false;
    if (formData.questions.length === 0) return false;
    
    return formData.questions.every(question => {
      if (!question.enonce.trim()) return false;
      
      if (question.type === 'qcm') {
        if (!question.options || question.options.length < 2) return false;
        if (!question.options.some(opt => opt.correcte)) return false;
        return question.options.every(opt => opt.texte.trim());
      }
      
      return true;
    });
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      alert('Veuillez compléter tous les champs requis et vérifier vos questions.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formattedDate = convertAndFormatDate(formData.date, time);
      
      await onSubmit({
        titre: formData.titre,
        date: formattedDate,
        matiere: cours,
        classe,
        statut: '', 
        questions: formData.questions
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {initialData ? 'Modifier le devoir' : 'Créer un nouveau devoir'}
        </h2>
        <p className="text-gray-600 mt-1">
          {cours} - {classe}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block font-medium text-gray-700">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => handleChange('titre', e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Titre du devoir"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-medium text-gray-700">
                Date limite <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block font-medium text-gray-700">
                Heure (optionnelle)
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                step="60"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Questions
              </h3>
              <p className="text-sm text-gray-500">
                {formData.questions.length} question{formData.questions.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={addQuestion}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <PlusIcon />
              Ajouter une question
            </button>
          </div>

          {formData.questions.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 mb-3">Aucune question ajoutée</p>
              <button
                type="button"
                onClick={addQuestion}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <PlusIcon />
                Ajouter votre première question
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.questions.map((question, index) => (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  index={index}
                  onUpdate={updateQuestion}
                  onRemove={removeQuestion}
                  onAddOption={addOption}
                  onUpdateOption={updateOption}
                  onRemoveOption={removeOption}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          
          <div className="flex items-center gap-4">
            {!isFormValid && (
              <span className="text-sm text-red-500">
                Complétez tous les champs requis
              </span>
            )}
            <button
              type="submit"
              className={`px-6 py-2.5 text-white rounded-lg transition-colors flex items-center gap-2 ${
                isFormValid 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enregistrement...
                </>
              ) : (
                initialData ? 'Mettre à jour' : 'Créer le devoir'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DevoirProfForm;
