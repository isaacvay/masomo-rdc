// src/components/BulletinHeader.tsx
import React from 'react';

const BulletinHeader: React.FC = () => (
  <div className="grid grid-cols-[25%_50%_25%] items-center pb-4 mb-4">
    <div className="flex justify-center">
      <img src="images/flag.png" alt="drapeau" className="w-24 h-16" />
    </div>
    <div className="text-center">
      <h1 className="text-xl font-bold">
        RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
      </h1>
      <h2 className="text-lg">
        MINISTÈRE DE L’ENSEIGNEMENT PRIMAIRE SECONDAIRE
      </h2>
    </div>
    <div className="flex justify-center">
      <img src="images/armoiries.png" alt="armoirie" className="w-24 h-24" />
    </div>
  </div>
);

export default BulletinHeader;
