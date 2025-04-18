"use client";
import React from "react";
import { Button } from '@headlessui/react';
import { ArrowUturnLeftIcon, CurrencyDollarIcon, UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export enum FinanceOption {
  STUDENTS = "students",
  PAYMENTS = "payments",
  BACK = "back",
}

interface FinanceMenuProps {
  selectedClass: string;
  onOptionSelect: (option: FinanceOption) => void;
}

const ButtonStyleConfig = {
  base: 'flex items-center gap-3 px-6 py-4 w-full text-left rounded-xl transition-all',
  variants: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-2 focus:ring-emerald-500',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-2 focus:ring-amber-500',
    back: 'bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-2 focus:ring-gray-400 border border-gray-300',
  },
  icons: 'w-6 h-6 stroke-current',
};

export default function FinanceMenu({ selectedClass, onOptionSelect }: FinanceMenuProps) {
  return (
    <section className="p-6 max-w-lg mx-auto space-y-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion Financière</h1>
        <p className="mt-1 text-lg font-semibold text-blue-600">{selectedClass}</p>
      </header>

      <div className="space-y-3">
        <Button
          as="button"
          onClick={() => onOptionSelect(FinanceOption.STUDENTS)}
          className={`${ButtonStyleConfig.base} ${ButtonStyleConfig.variants.primary}`}
        >
          <UserGroupIcon className={ButtonStyleConfig.icons} />
          <span>Liste des élèves</span>
        </Button>

        <Button
          as="button"
          onClick={() => onOptionSelect(FinanceOption.PAYMENTS)}
          className={`${ButtonStyleConfig.base} ${ButtonStyleConfig.variants.success}`}
        >
          <CurrencyDollarIcon className={ButtonStyleConfig.icons} />
          <span>Gestion des paiements</span>
        </Button>

        <div className="pt-4 mt-4 border-t border-gray-200">
          <Button
            as="button"
            onClick={() => onOptionSelect(FinanceOption.BACK)}
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