"use client";
import React, { useState } from "react";
import Navleft from "../components/dashbordcomp/nav/Navleft";
import ClassesDashboard from "../components/dashbordcomp/classes/classes";
import EleveForm from "../components/dashbordcomp/formulaire/EleveForm";
import NotesListeEleve from "../components/dashbordcomp/eleve/NotesListeEleve";
import OpetionsEtclasse from "../components/dashbordcomp/eleve/OpetionsEtclasse";
import ListeDesEleves from "../components/dashbordcomp/eleve/ListeDesEleves";
import ProfesseurForm from "../components/dashbordcomp/formulaire/ProfesseurForm";
import ListeClasses from "../components/dashbordcomp/eleve/ListeClasses";
import BulletinListeEleve from "../components/dashbordcomp/bulletin/BulletinListeEleve";
import DashHome from "../components/dashbordcomp/DashHome";
import Parametres from "../components/dashbordcomp/parametres/parametres";
import ListeDesProfs from "../components/dashbordcomp/prof/ListeDesProf";
import BulletinEleve from "../components/dashbordcomp/bulletin/BulletinEleve";
import ListeDesCours from "../components/dashbordcomp/prof/listeDesCours";
import EleveListeDesCours from "../components/dashbordcomp/eleve/EleveListeDesCours";
import Cours from "../components/dashbordcomp/classes/cours";

export default function DashboardFullScreen() {
  // États pour gérer la page active et les sélections
  const [selectedPage, setSelectedPage] = useState<string>("Accueil");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedClassForCourse, setSelectedClassForCourse] = useState<string | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);

  let content;
  switch (selectedPage) {
    case "Accueil":
      content = <DashHome />;
      break;
    case "Parametres":
      content = <Parametres />;
      break;
    case "ClassesEtCours":
      content = (
        <ClassesDashboard
          onClassSelect={(className) => {
            setSelectedClass(className);
            setSelectedPage("listeDesCours");
          }}
        />
      );
      break;
    case "listeDesCours":
      content = selectedClass ? (
        <Cours selectedClass={selectedClass} onRetour={() => setSelectedPage("ClassesEtCours")} />
      ) : (
        <div className="text-2xl font-semibold text-center p-4">
          Veuillez sélectionner une classe pour afficher les cours.
        </div>
      );
      break;
    
    case "EnregistrementEleve":
      content = <EleveForm />;
      break;
    case "EnregistrementProfesseur":
      content = <ProfesseurForm />;
      break;
    case "ListeDesCours":
      content = <ListeDesCours />;
      break;
      case "cours":
            content = <EleveListeDesCours />;
            break;
    case "listeclasses":
       
      content = <BulletinListeEleve />;
      break;
    case "bulletin":
      content = <BulletinEleve />;
      break;
    case "listeprof":
      content = <ListeDesProfs />;
      break;
    case "SaisieDeNotes":
      content = (
        <OpetionsEtclasse
          onCourseSelect={(courseName, className) => {
            setSelectedCourse(courseName);
            setSelectedClassForCourse(className);
            setSelectedPage("NoteslisteEleve");
          }}
        />
      );
      break;
    case "NoteslisteEleve":
      content =
        selectedCourse && selectedClassForCourse ? (
          <NotesListeEleve
            selectedCourse={selectedCourse}
            selectedClass={selectedClassForCourse}
            onRetour={() => setSelectedPage("SaisieDeNotes")}
          />
        ) : (
          <div className="text-2xl font-semibold text-center p-4">
            Veuillez sélectionner un cours pour afficher les élèves.
          </div>
        );
      break;
    case "elevesparclasse":
      content = (
        <ListeClasses
          onClassSelect={(classe) => {
            setSelectedClass(classe);
            setSelectedPage("bulletinNotesListeEleve");
          }}
          
          
        />
      );
      break;
    case "bulletinNotesListeEleve":
      content = selectedClass ? (
        <ListeDesEleves selectedClass={selectedClass}
        onRetour={() => setSelectedPage("elevesparclasse")}
        />
      ) : (
        <div className="text-2xl font-semibold text-center p-4">
          Veuillez sélectionner une classe.
        </div>
      );
      break;
    default:
      content = <DashHome />;
  }

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Bouton du menu mobile */}
      <button
        onClick={() => setIsNavOpen(!isNavOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-950 text-white rounded-lg shadow-lg hover:bg-blue-900 transition-colors"
        aria-label="Toggle navigation"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="md:grid md:grid-cols-[20%_80%] min-h-screen">
        {/* Navigation Sidebar */}
        <div
          className={`fixed md:relative inset-y-0 left-0 w-64 transform ${
            isNavOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 z-40 w-72 transition-transform duration-300 ease-in-out bg-gradient-to-r from-blue-950 to-blue-800 shadow-xl`}
        >
          <div className="h-full overflow-y-auto pt-20 pb-4">
            <Navleft
              onPageChange={(page) => {
                setSelectedPage(page);
                setIsNavOpen(false);
              }}
            />
          </div>
        </div>

        {/* Zone de contenu */}
        <div className="p-6 pt-20 bg-gray-100 h-full overflow-y-auto">
          {content}
        </div>
      </div>

      {/* Overlay mobile pour fermer le menu */}
      {isNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsNavOpen(false)}
        />
      )}
    </div>
  );
}
