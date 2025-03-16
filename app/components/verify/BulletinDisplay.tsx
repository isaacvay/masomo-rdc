// components/Bulletin/BulletinDisplay.tsx
"use client";
import React from "react";
import { Bulletin } from "./BulletinTypes";
import BulletinHeaderDisplay from "./BulletinHeaderDisplay";
import BulletinTableDisplay from "./BulletinTableDisplay";

// Ces composants sont importés depuis d'autres parties de votre projet
import BulletinHeader from "@/app/components/dashbordcomp/bulletin/BulletinHeader";
import BulletinFooter from "@/app/components/dashbordcomp/bulletin/BulletinFooter";
import QRCode from "react-qr-code";

interface BulletinDisplayProps {
  bulletin: Bulletin;
}

const BulletinDisplay: React.FC<BulletinDisplayProps> = ({ bulletin }) => (
  
  <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-2xl p-4 sm:p-6 md:p-8">
    <BulletinHeader />
    <BulletinHeaderDisplay
      student={bulletin.Student}
      school={bulletin.school}
      timestamp={bulletin.timestamp} 
      anneeScolaire={bulletin.anneeScolaire || ""}   
         />
    <div className="overflow-x-auto">
      <BulletinTableDisplay
        flattenedSubjects={bulletin.flattenedSubjects || []}
        gradesMapping={bulletin.gradesMapping || {}}
        totals={bulletin.totals}
        maxTotals={bulletin.maxTotals}
        percentages={bulletin.percentages}
        ranking={bulletin.ranking}
      />
    </div>
    <BulletinFooter />
     {/* Bloc QR Code et Code de Vérification */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex flex-col justify-center mt-3 items-start text-left">
                <p>(1)Biffer la mention inutile</p>
                <p>
                  Note importante : Le bulletin est sans valeur s’il est raturé ou surchargé
                </p>
              </div>
              <div className="flex justify-center items-center mb-3">
              <QRCode
                  value={`https://www.masomordc.com/pages/verification-bulletin?bulletinId=${bulletin.id}`}
                  size={60}
                />
              </div>
              <div className="mt-4 flex flex-col justify-center items-center text-right">
                <div className="mt-7 text-gray-600">
                Code de vérification : <strong>{bulletin.id}</strong>
                </div>
              </div>
            </div>
          </div>
);

export default BulletinDisplay;
