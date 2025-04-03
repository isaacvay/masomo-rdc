import React from 'react';

interface Student {
  average?: number;
}

interface StatisticsProps {
  students: Student[];
}

export default function Statistics({ students, }: StatisticsProps) {

  return (
    <div className="mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-500">Nombre d'élèves</p>
          <p className="text-xl font-bold text-gray-800">{students.length}</p>
        </div>
      </div>
    </div>
  );
}