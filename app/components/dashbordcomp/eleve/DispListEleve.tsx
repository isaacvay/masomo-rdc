"use client";

import React, { useState } from "react";
import { Button } from "@headlessui/react";
import {
  UserIcon,
  DocumentTextIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import ProfileEleve from "./ProfileEleve";
import BulletinAffiche from "../bulletin/BulletinAffiche";

interface Student {
  id: string;
  displayName: string;
  sexe: string;
  neEA: string;
  naissance: string;
  section: string;
  classe: string;
  numPerm: string;
  email: string;
  password: string;
  bulletinId?: string;
  schoolId: string;
}

interface SchoolInfo {
  province: string;
  ville: string;
  commune: string;
  nom: string;
  code: string;
}

interface DispListEleveProps {
  student: Student;
  schoolInfo: SchoolInfo;
  onRetour: () => void;
}

// Enumération pour la gestion de la vue
enum DispOption {
  LISTE = "liste",
  PROFILE = "profile",
  BULLETIN = "bulletin",
}

export default function DispListEleve({ student, schoolInfo, onRetour }: DispListEleveProps) {
  const [affichage, setAffichage] = useState<DispOption>(DispOption.LISTE);

  // Méthode de retour à la vue principale (menu)
  const handleRetour = () => setAffichage(DispOption.LISTE);

  // Configuration centralisée des styles pour les boutons
  const baseButton =
    "flex items-center gap-3 px-6 py-4 w-full text-left rounded-xl transition-all shadow-md";
  const variants = {
    primary:
      "bg-blue-600 hover:bg-blue-700 text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    secondary:
      "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
    back: "bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
  };
  const iconStyle = "w-6 h-6";

  // Vue Profil
  if (affichage === DispOption.PROFILE) {
    return (
      <section className="p-6 mx-auto space-y-4">
        <ProfileEleve
          uid={student.id}
          displayName={student.displayName}
          sexe={student.sexe}
          neEA={student.neEA}
          naissance={student.naissance}
          section={student.section}
          classe={student.classe}
          numPerm={student.numPerm}
          email={student.email}
          password={student.password}
          bulletinId={student.bulletinId || ""}
          onRetour={handleRetour}
        />
      </section>
    );
  }

  // Vue Bulletin
  if (affichage === DispOption.BULLETIN) {
    return (
      <section className="p-6  mx-auto space-y-4">
        <Button onClick={handleRetour} className={`${baseButton} ${variants.back} max-w-xs`}>
          <ArrowUturnLeftIcon className={iconStyle} />
          <span>Retour</span>
        </Button>
        <BulletinAffiche
          selectedStudent={{ ...student, bulletinId: student.bulletinId || "" }}
          schoolInfo={schoolInfo}
        />
      </section>
    );
  }

  // Vue Liste : menu d'options
  return (
    <section className="p-6 max-w-xl mx-auto mt-6 space-y-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 uppercase">
          Options pour {student.displayName}
        </h1>
      </header>

      <div className="space-y-3">
        <Button
          onClick={() => setAffichage(DispOption.PROFILE)}
          className={`${baseButton} ${variants.primary}`}
        >
          <UserIcon className={iconStyle} />
          <span>Voir le Profil</span>
        </Button>
        <Button
          onClick={() => setAffichage(DispOption.BULLETIN)}
          className={`${baseButton} ${variants.secondary}`}
        >
          <DocumentTextIcon className={iconStyle} />
          <span>Afficher le Bulletin</span>
        </Button>
      </div>

      <div className="pt-4 mt-4 border-t border-gray-200">
        <Button onClick={onRetour} className={`${baseButton} ${variants.back}`}>
          <ArrowUturnLeftIcon className={iconStyle} />
          <span>Retour</span>
        </Button>
      </div>
    </section>
  );
}
