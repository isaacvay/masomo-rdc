// src/components/BulletinFooter.tsx
import React from 'react';

const BulletinFooter: React.FC = () => (
  <div className="mt-4 text-sm">
    <p>
      - L’élève ne pourra passer dans la classe supérieure s’il n’a
      subi avec succès un examen de repêchage en……………………………………………………………………………………….(1)
    </p>
    <div className="grid grid-cols-2">
      <div>
        <p>- L’élève passe dans la classe supérieure (1)</p>
        <p>- L’élève double sa classe (1)</p>
        <p>- L’élève a échoué et est orienté vers............... (1)</p>
      </div>
      <div className="pt-6 pl-20">
        <p>Fait à ...................., le…………./………./20……</p>
        <p className="pt-10 font-bold pl-10">Le Chef d’Etablissement</p>
      </div>
    </div>
    <div className="flex justify-between py-10 px-14 font-bold">
      <p>Signature de l’élève</p>
      <p>Sceau de l’école</p>
      <p>Nom et Signature</p>
    </div>
    <div>
      <p>(1)Biffer la mention inutile</p>
      <p>
        Note importante : Le bulletin est sans valeur s’il est raturé ou
        surchargé
      </p>
    </div>
  </div>
);

export default BulletinFooter;
