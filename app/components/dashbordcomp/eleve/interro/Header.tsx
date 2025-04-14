import React from 'react';
import { ArrowLeft, BookOpen, Users, Save, Loader2, Printer } from 'lucide-react';

interface HeaderProps {
  onRetour: () => void;
  selectedCourse: string;
  selectedClass: string;
  activePeriod: number;
  isSaving: boolean;
  isLoading: boolean;
  handleSave: () => void;
  handleSaveAverage: () => void;
  handlePrint: () => void; // Nouvelle prop pour la fonction d'impression
}

export default function Header({
  onRetour,
  selectedCourse,
  selectedClass,
  activePeriod,
  isSaving,
  isLoading,
  handleSave,
  handleSaveAverage,
  handlePrint, // Destructuration de la nouvelle prop
}: HeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Section Gauche */}
      <div>
        <button 
          onClick={onRetour} 
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium">Retour</span>
        </button>
        
        {/* Contenu visible uniquement à l'écran */}
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Gestion des notes
          </h1>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            Période {activePeriod}
          </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 mt-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BookOpen className="w-4 h-4" />
            <span className="font-medium">{selectedCourse}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span className="font-medium">{selectedClass}</span>
          </div>
        </div>
      </div>

      {/* Contenu spécifique pour l'impression */}
      <div id="print-header" className="hidden">
        <h1>
          {activePeriod >= 5 ? 'Liste des examens' : 'Liste des interrogations'}
        </h1>
        <div>
          Cours : {selectedCourse} | Classe : {selectedClass}
        </div>
      </div>
      
      {/* Section Droite */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isSaving || isLoading
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {isSaving ? 'Enregistrement...' : 'Enregistrer les Interros'}
        </button>
        <button
          onClick={handleSaveAverage}
          disabled={isSaving || isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isSaving || isLoading
              ? 'bg-green-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {isSaving ? 'Enregistrement...' : 'Enregistrer la moyenne'}
        </button>
        {/* Bouton d'Impression */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors"
        >
          <Printer className="w-5 h-5" />
          <span>Imprimer</span>
        </button>
      </div>
    </div>
  );
}
