"use client";
import React from "react";

const Legend: React.FC = () => (
  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-6">
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 bg-green-200 border border-green-400 rounded-sm" />
      Payé
    </div>
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 bg-red-200 border border-red-400 rounded-sm" />
      Non payé
    </div>
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 bg-blue-200 border border-blue-400 rounded-sm" />
      Mois en cours
    </div>
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 bg-gray-200 border border-gray-400 rounded-sm" />
      À venir
    </div>
  </div>
);

export default Legend;