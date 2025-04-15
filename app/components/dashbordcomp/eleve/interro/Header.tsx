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
  handlePrint: () => void;
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
  handlePrint,
}: HeaderProps) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top Row - Back button and main title */}
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-start">
            <button 
              onClick={onRetour} 
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors group"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span className="font-medium hidden sm:inline">Retour</span>
            </button>
            
            <div className="flex flex-col items-end sm:items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
                Gestion des notes
              </h1>
              <span className="mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                Période {activePeriod}
              </span>
            </div>
            
            <div className="w-9"></div> {/* Spacer for balance */}
          </div>

          {/* Middle Row - Course and class info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium truncate" title={selectedCourse}>
                  {selectedCourse}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{selectedClass}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Print-only content */}
        <div id="print-header" className="hidden">
          <h1>
            {activePeriod >= 5 ? 'Liste des examens' : 'Liste des interrogations'}
          </h1>
          <div>
            Cours : {selectedCourse} | Classe : {selectedClass}
          </div>
        </div>
        
        {/* Bottom Row - Action buttons */}
        <div className="mt-4 flex flex-col xs:flex-row gap-3">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isSaving || isLoading
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              aria-label="Enregistrer les interrogations"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span className="whitespace-nowrap">
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </span>
            </button>

            <button
              onClick={handleSaveAverage}
              disabled={isSaving || isLoading}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isSaving || isLoading
                  ? 'bg-green-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              aria-label="Enregistrer la moyenne"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span className="whitespace-nowrap">Enregistrer moyenne</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors col-span-1 xs:col-span-2 lg:col-span-1"
              aria-label="Imprimer"
            >
              <Printer className="w-5 h-5" />
              <span>Imprimer</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
