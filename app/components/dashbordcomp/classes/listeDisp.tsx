import React from 'react';
import { Button } from '@headlessui/react';
import { ClockIcon, BookOpenIcon, AcademicCapIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

// Enumération type-safe avec valeurs explicites
export enum ListeDispOption {
  LISTE_COURS = "listeDesCours",
  HORAIRE_REGULIER = "horaire",
  HORAIRE_EXAMEN = "horaireExam",
  RETOUR_CLASSES = "ClassesEtCours",
}


// Types pour les props avec documentation JSDoc
interface ListeDispProps {
  /** Nom de la classe sélectionnée ou null si non sélectionnée */
  selectedClass: string | null;
  /** Callback déclenché lors de la sélection d'une option */
  onOptionSelect: (option: ListeDispOption) => void;
  /** État de chargement pour le skeleton loader */
  isLoading?: boolean;
}

// Configuration centralisée des styles Tailwind avec variants
const ButtonStyleConfig = {
  base: 'flex items-center gap-3 px-6 py-4 w-full text-left rounded-xl transition-all',
  variants: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-2 focus:ring-emerald-500',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-2 focus:ring-amber-500',
    back: 'bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-2 focus:ring-gray-400 border border-gray-300',
  },
  icons: 'w-6 h-6 stroke-current',
  loading: 'animate-pulse bg-gray-200 text-transparent',
};

export default function ListeDisp({ selectedClass, onOptionSelect, isLoading = false }: ListeDispProps) {
  // État de chargement
  if (isLoading) {
    return (
      <div className="p-6 max-w-md mx-auto space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`${ButtonStyleConfig.base} ${ButtonStyleConfig.loading}`}>
            <div className="w-6 h-6 bg-gray-300 rounded" />
            <span className="flex-1">Chargement...</span>
          </div>
        ))}
      </div>
    );
  }

  // Gestion des erreurs et états vides
  if (!selectedClass) {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <div className="p-4 bg-rose-50 rounded-lg border border-rose-100">
          <p className="text-rose-700 font-medium">
            ⚠️ Veuillez sélectionner une classe pour afficher les options
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="p-6 max-w-md mx-auto space-y-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Configuration de la classe
        </h1>
        <p className="mt-1 text-lg font-semibold text-blue-600">
          {selectedClass}
        </p>
      </header>

      <div className="space-y-3">
        <Button
          as="button"
          onClick={() => onOptionSelect(ListeDispOption.LISTE_COURS)}
          className={`${ButtonStyleConfig.base} ${ButtonStyleConfig.variants.primary}`}
        >
          <BookOpenIcon className={ButtonStyleConfig.icons} />
          <span>Titulaire et cours</span>
        </Button>

        <Button
          as="button"
          onClick={() => onOptionSelect(ListeDispOption.HORAIRE_REGULIER)}
          className={`${ButtonStyleConfig.base} ${ButtonStyleConfig.variants.success}`}
        >
          <ClockIcon className={ButtonStyleConfig.icons} />
          <span>Horaire régulier</span>
        </Button>

        <Button
          as="button"
          onClick={() => onOptionSelect(ListeDispOption.HORAIRE_EXAMEN)}
          className={`${ButtonStyleConfig.base} ${ButtonStyleConfig.variants.warning}`}
        >
          <AcademicCapIcon className={ButtonStyleConfig.icons} />
          <span>Horaire des examens</span>
        </Button>

        <div className="pt-4 mt-4 border-t border-gray-200">
          <Button
            as="button"
            onClick={() => onOptionSelect(ListeDispOption.RETOUR_CLASSES)}
            className={`${ButtonStyleConfig.base} ${ButtonStyleConfig.variants.back}`}
          >
            <ArrowUturnLeftIcon className={ButtonStyleConfig.icons} />
            <span>Retour aux classes</span>
          </Button>
        </div>
      </div>
    </section>
  );
}