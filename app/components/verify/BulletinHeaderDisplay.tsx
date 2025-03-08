// components/Bulletin/BulletinHeaderDisplay.tsx
"use client";
import React from "react";
import { Bulletin } from "./BulletinTypes";

interface BulletinHeaderDisplayProps {
  student: Bulletin["Student"];
  school: Bulletin["school"];
  timestamp: Bulletin["timestamp"];
}

const BulletinHeaderDisplay: React.FC<BulletinHeaderDisplayProps> = ({ student, school, timestamp }) => {
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };

  // Calcul de l'année scolaire
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0 = janvier, 9 = octobre

  const [startYear, endYear] = currentMonth >= 9 
    ? [currentYear, currentYear + 1]
    : [currentYear - 1, currentYear];

  return (
    <div className="border p-4 mx-auto uppercase">
      {/* Identification */}
      <div className="mb-4 items-center">
        <label className="font-bold pl-24 pr-2">N° ID.</label>
        {Array(27).fill("").map((_, i) => (
          <span key={i} className="border border-black inline-block w-6 h-6"></span>
        ))}
      </div>

      {/* Informations sur l'école */}
      <div className="border-t border-black py-2">
        <p className="font-bold">Province: {school?.province || "Province de l'école"}</p>
      </div>

      {/* Infos élève et école */}
      <div className="grid grid-cols-2 border-t border-black py-2">
        <div>
          <p><span className="font-bold">VILLE :</span> {school?.ville || "Ville"}</p>
          <p><span className="font-bold">COMMUNE :</span> {school?.commune || "Commune"}</p>
          <p><span className="font-bold">ECOLE :</span> {school?.nom || "Nom de l'école"}</p>
          <p><span className="font-bold">CODE :</span> {school?.code || "Code"}</p>
        </div>
        <div className="grid grid-cols-2">
          <div>
            <p className="font-bold uppercase">
              <span className="font-medium">ELEVE :</span> {student.displayName} 
            </p>
            <p className="font-bold uppercase">
              <span className="font-medium">NE (E) A :</span> {student.neEA} 
            </p>
            <p className="font-bold">
              <span className="font-medium">CLASSE :</span> {student.classe}
            </p>
            <p className="font-bold">
              <span className="font-medium pr-2">N° PERM :</span> {student.numPerm}
            </p>
          </div>
          <div>
            <p className="font-bold uppercase">
              <span className="font-medium">SEXE :</span> {student.sexe}
            </p>
            <p className="font-bold uppercase">
              <span className="font-medium">LE :</span> {formatDate(student.naissance)}
            </p>
          </div>
        </div>
      </div>

      {/* Titre du bulletin */}
      <div className="border-t border-black text-center py-2 font-bold">
        <p>
          BULLETIN DE LA {student.classe} ANNÉE {student.section}{" "}
          ANNÉE SCOLAIRE {startYear}-{endYear}
        </p>
      </div>
    </div>
  );
};

export default BulletinHeaderDisplay;
