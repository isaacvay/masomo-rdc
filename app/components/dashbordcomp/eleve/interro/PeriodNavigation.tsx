import React from 'react';
import { ChevronRight } from 'lucide-react';

interface PeriodNavigationProps {
  activePeriod: number;
  setActivePeriod: (period: number) => void;
}

export default function PeriodNavigation({ activePeriod, setActivePeriod }: PeriodNavigationProps) {
  return (
    <nav className="space-y-1 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
      <h2 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Périodes scolaires
      </h2>
      {[1, 2, 3, 4].map((period) => (
        <button
          key={period}
          onClick={() => setActivePeriod(period)}
          className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all ${
            activePeriod === period
              ? 'bg-blue-50 text-blue-700 font-medium shadow-inner'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              activePeriod === period ? 'bg-blue-500' : 'bg-gray-300'
            }`} />
            <span>Période {period}</span>
          </div>
          {activePeriod === period && (
            <ChevronRight className="w-4 h-4 text-blue-500" />
          )}
        </button>
      ))}
    </nav>
  );
}
