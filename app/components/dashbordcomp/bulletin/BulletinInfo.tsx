"use client";
import React from "react";

export interface BulletinInfoProps {
  selectedStudent: {
    displayName: string;
    sexe: string;
    neEA: string;
    naissance: string;
    classe: string;
    section: string;
    numPerm: string;
  };
  schoolInfo: {
    province: string;
    ville: string;
    commune: string;
    nom: string;
    code: string;
  };
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
};

const BulletinInfo: React.FC<BulletinInfoProps> = ({ selectedStudent, schoolInfo }) => {
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
        <p className="font-bold">Province: {schoolInfo?.province || "Province de l'école"}</p>
      </div>

      {/* Infos élève et école */}
      <div className="grid grid-cols-2 border-t border-black py-2">
        <div>
          <p><span className="font-bold">VILLE :</span> {schoolInfo?.ville || "Ville"}</p>
          <p><span className="font-bold">COMMUNE :</span> {schoolInfo?.commune || "Commune"}</p>
          <p><span className="font-bold">ECOLE :</span> {schoolInfo?.nom || "Nom de l'école"}</p>
          <p><span className="font-bold">CODE :</span> {schoolInfo?.code || "Code"}</p>
        </div>
        <div className="grid grid-cols-2">
          <div>
          <p className="font-bold uppercase">
            <span className="font-medium">ELEVE :</span> {selectedStudent.displayName} 
          </p>
          <p className="font-bold uppercase">
            <span className="font-medium">NE (E) A :</span> {selectedStudent.neEA} 
          </p>
          <p className="font-bold">
            <span className="font-medium">CLASSE :</span> {selectedStudent.classe}
          </p>
          <p className="font-bold">
            <span className="font-medium pr-2">N° PERM :</span> {selectedStudent.numPerm}
          </p>
          </div>
          <div>
          <p className="font-bold uppercase">
            <span className="font-medium ">SEXE :</span> {selectedStudent.sexe}
          </p>
          <p className="font-bold uppercase">
            <span className="font-medium ">LE :</span> {formatDate(selectedStudent.naissance)}
          </p>
          </div>
          
        </div>
      </div>

      {/* Titre du bulletin */}
      <div className="border-t border-black text-center py-2 font-bold">
        <p>
          BULLETIN DE LA {selectedStudent.classe} ANNÉE {selectedStudent.section} {" "}
          ANNÉE SCOLAIRE {startYear}-{endYear}
        </p>
      </div>
    </div>
  );
};

export default BulletinInfo;
