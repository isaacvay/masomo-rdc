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
    <div className="ml-auto flex flex-col items-end text-right">
      <div className="flex flex-col items-center">
        <QRCode
          value={`https://masomo-rdc.vercel.app/pages/verification-bulletin?bulletinId=${bulletin.id}`}
          size={60}
        />
        <div className="mt-4 text-center">
          Code de vérification : <strong>{bulletin.id}</strong>
        </div>
      </div>
    </div>
  </div>
);

export default BulletinDisplay;
