import React from 'react';
import { ArrowLeft, BookOpen, Users, Save, Loader2 } from 'lucide-react';

interface HeaderProps {
  onRetour: () => void;
  selectedCourse: string;
  selectedClass: string;
  activePeriod: number;
  isSaving: boolean;
  isLoading: boolean;
  handleSave: () => void;
  handleSaveAverage: () => void;
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
}: HeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-lg">
      {/* Left Section - Back Button, Title, and Info */}
      <div className="flex flex-col gap-3">
        {/* Back Button */}
        <button
          onClick={onRetour}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors group"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium">Retour</span>
        </button>

        {/* Title and Period */}
        <div className="flex flex-col xs:flex-row xs:items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Gestion des notes
          </h1>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full w-fit">
            Période {activePeriod}
          </span>
        </div>

        {/* Course and Class Info */}
        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium truncate max-w-[180px] xs:max-w-xs">
              {selectedCourse}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium truncate max-w-[180px] xs:max-w-xs">
              {selectedClass}
            </span>
          </div>
        </div>
      </div>

      {/* Right Section - Action Buttons */}
      <div className="flex flex-col xs:flex-row gap-3 w-full md:w-auto">
        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isSaving || isLoading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          aria-label={isSaving ? 'Enregistrement en cours' : 'Enregistrer les Interros'}
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span className="whitespace-nowrap">
            {isSaving ? 'Enregistrement...' : 'Enregistrer les Interros'}
          </span>
        </button>

        {/* Save Average Button */}
        <button
          onClick={handleSaveAverage}
          disabled={isSaving || isLoading}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isSaving || isLoading
              ? 'bg-green-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
          aria-label={isSaving ? 'Enregistrement en cours' : 'Enregistrer la moyenne'}
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span className="whitespace-nowrap">
            {isSaving ? 'Enregistrement...' : 'Enregistrer la moyenne'}
          </span>
        </button>
      </div>
    </div>
  );
}
