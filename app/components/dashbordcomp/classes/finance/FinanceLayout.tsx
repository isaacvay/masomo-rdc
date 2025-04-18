"use client";
import React, { useState } from "react";
import FinanceClasses from "./FinanceClasses";
import FinanceMenu from "./FinanceMenu";
import FinanceStudents from "./FinanceStudents";
import FinancePayments from "./FinancePayments";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";

enum FinanceOption {
  BACK = "back",
  STUDENTS = "students",
  PAYMENTS = "payments",
}


export default function FinanceLayout() {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<FinanceOption | null>(null);

  const handleClassSelect = (className: string) => {
    setSelectedClass(className);
    setCurrentView(null);
  };

  const handleOptionSelect = (option: FinanceOption) => {
    if (option === FinanceOption.BACK) {
      setSelectedClass(null);
    } else {
      setCurrentView(option);
    }
  };

  if (currentView) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
          <button 
            onClick={() => setCurrentView(null)}
            className="flex items-center gap-2 text-blue-600 mb-4"
          >
            <ArrowUturnLeftIcon className="w-5 h-5" />
            <span>Retour aux options</span>
          </button>
          
          {currentView === FinanceOption.STUDENTS && (
            <FinanceStudents selectedClass={selectedClass!} />
          )}
          
          {currentView === FinanceOption.PAYMENTS && (
            <FinancePayments selectedClass={selectedClass!} />
          )}
          
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {!selectedClass ? (
        <FinanceClasses onClassSelect={handleClassSelect} />
      ) : (
        <FinanceMenu 
          selectedClass={selectedClass} 
          onOptionSelect={handleOptionSelect} 
        />
      )}
    </div>
  );
}