"use client";
import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/config/firebase";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import {
  HomeIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UserPlusIcon,
  UsersIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { Briefcase, CalendarDays, UserCircleIcon } from "lucide-react";
import { Caladea } from "next/font/google";

interface NavleftProps {
  onPageChange: (page: string) => void;
}

interface AppUser {
  name: string;
  role: string;
  secondRole?: string | null;
  schoolId?: string;
}

interface NavItemData {
  icon: React.ReactNode;
  label: string;
  page: string;
  isRed?: boolean;
}

const mainNavItems: NavItemData[] = [
  { icon: <HomeIcon className="h-6 w-6" />, label: "Accueil", page: "Accueil" },
  { icon: <Cog6ToothIcon className="h-6 w-6" />, label: "Paramètres", page: "Parametres" },
];

const teacherNavItems: NavItemData[] = [
  { icon: <BookOpenIcon className="h-6 w-6" />, label: "Saisie de Notes", page: "SaisieDeNotes" },
  { icon: <AcademicCapIcon className="h-6 w-6" />, label: "Devoir", page: "devoirProf" },
  { icon:<CalendarDays className="h-6 w-6" /> , label: "Horaire", page: "horaireProf" },
  { icon: <AcademicCapIcon className="h-6 w-6" />, label: "Liste des cours", page: "ListeDesCours" },
  { icon:<CalendarDays className="h-6 w-6" /> , label: "Horaire des exam", page: "HorairedesexamensProf" },
];

const studentNavItems: NavItemData[] = [
  { icon: <BookOpenIcon className="h-6 w-6" />, label: "Bulletin", page: "bulletin" },
  { icon:<CalendarDays className="h-6 w-6" /> , label: "Horaire", page: "horaireEleve" },
  { icon: <AcademicCapIcon className="h-6 w-6" />, label: "Devoir", page: "devoirEleve" },
  { icon: <Briefcase className="h-6 w-6" />, label: "Cours", page: "cours" },
  { icon:<CalendarDays className="h-6 w-6" /> , label: "Horaire des exam", page: "HorairedesexamensEleve" },
];

const titulaireNavItems: NavItemData[] = [
  { icon: <UsersIcon className="h-6 w-6" />, label: "Bulletins", page: "listeclasses" },
];

const schoolNavItems: NavItemData[] = [
  { icon: <UserPlusIcon className="h-6 w-6" />, label: "Inscription élève", page: "EnregistrementEleve" },
  { icon: <UserPlusIcon className="h-6 w-6" />, label: "Ajouter un Prof", page: "EnregistrementProfesseur" },
  { icon: <AcademicCapIcon className="h-6 w-6" />, label: "Classes et Cours", page: "ClassesEtCours" },
  { icon: <UsersIcon className="h-6 w-6" />, label: "Liste des profs", page: "listeprof" },
  { icon: <ChartBarIcon className="h-6 w-6" />, label: "Élèves par classe", page: "elevesparclasse" },
];

const comptableNavItems: NavItemData[] = [
  { icon: <UserPlusIcon className="h-6 w-6" />, label: "Inscription élève", page: "EnregistrementEleve" },
  { icon: <ChartBarIcon className="h-6 w-6" />, label: "Élèves par classe", page: "elevesparclasse" },
];

const logoutItem: NavItemData = {
  icon: <ArrowLeftOnRectangleIcon className="h-6 w-6" />,
  label: "Déconnexion",
  page: "Deconnexion",
  isRed: true,
};

const NavItem = ({
  icon,
  label,
  onClick,
  isRed = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isRed?: boolean;
}) => (
  <li>
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-4 px-4 py-3 rounded-lg transition transform hover:scale-105 duration-200 ${
        isRed ? "text-red-400 hover:bg-red-500/20" : "text-gray-200 hover:bg-white/10"
      }`}
    >
      <span className={`transition-transform duration-200 ${isRed ? "text-red-400" : "text-blue-400"}`}>
        {icon}
      </span>
      <span className="text-md font-medium">{label}</span>
    </button>
  </li>
);

export default function Navleft({ onPageChange }: NavleftProps) {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTitulaire, setIsTitulaire] = useState(false);
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const docRef = doc(db, "users", firebaseUser.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser({
              name: data.displayName || firebaseUser.email || "Utilisateur",
              role: data.role || "Utilisateur",
              secondRole: data.secondRole || null,
              schoolId: data.schoolId || null,
            });
          } else {
            let name = firebaseUser.displayName || firebaseUser.email || "Utilisateur";
            let role = "Utilisateur";
            if (firebaseUser.email) {
              const email = firebaseUser.email.toLowerCase().trim();
              role = email.endsWith("@ecole.masomordc.cd")
                ? "école"
                : email.endsWith("@prof.masomordc.cd")
                ? "professeur"
                : email.endsWith("@elev.masomordc.cd")
                ? "élève"
                : "Utilisateur";
            }
            setUser({ name, role, secondRole: null });
          }
        } catch (error: any) {
          console.error("Erreur lors de la récupération du document utilisateur :", error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db]);

  // Vérifier si le professeur est titulaire en recherchant dans la collection "titulaires" de l'école
  useEffect(() => {
    const checkTitulaire = async () => {
      if (user && user.role === "professeur" && user.schoolId) {
        try {
          const titulairesRef = collection(db, "schools", user.schoolId, "titulaires");
          const q = query(titulairesRef, where("professeur", "==", user.name));
          const snapshot = await getDocs(q);
          setIsTitulaire(!snapshot.empty);
        } catch (error: any) {
          console.error("Erreur lors de la vérification du statut de titulaire :", error);
        }
      }
    };
    checkTitulaire();
  }, [user, db]);

  if (loading) return <div>Chargement...</div>;

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  // Définition des sections de navigation selon le rôle
  const navSections = [{ title: "Navigation", items: mainNavItems }];

  if (user?.role === "professeur" && user.secondRole === "comptable") {
    navSections.push({ title: "Comptabilité", items: comptableNavItems });
  }

  if (user?.role === "professeur") {
    navSections.push({ title: "Pédagogie", items: teacherNavItems });
    // Ajout de la section "Titulaire" si le professeur est identifié comme tel
    if (isTitulaire) {
      navSections.push({ title: "Titulaire", items: titulaireNavItems });
    }
  }

  if (user?.role === "élève") {
    navSections.push({ title: "Bulletin", items: studentNavItems });
  }

  if (user?.role === "école") {
    navSections.push({ title: "Scolarité", items: schoolNavItems });
  }

  return (
    <aside className="w-64 transform scale-90 md:scale-100 p-6 mt-5 ml-4 mr-4 bg-white/10 backdrop-blur-md shadow-xl border-r border-white/20">
      <div className="flex items-center space-x-4 p-2 bg-white/20 rounded-xl mb-10">
        <UserCircleIcon className="h-12 w-12 text-cyan-400" />
        <div>
          <p className="text-sm font-semibold text-white uppercase">{user?.name}</p>
          <p className="text-sm text-gray-300">{user?.role}</p>
          {user?.secondRole && <p className="text-xs text-gray-400">{user.secondRole}</p>}
        </div>
      </div>

      <nav className="space-y-8">
        {navSections.map((section) => (
          <div key={section.title}>
            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {section.title}
            </h3>
            <ul className="space-y-2">
              {section.items.map((item) => (
                <NavItem
                  key={item.page}
                  icon={item.icon}
                  label={item.label}
                  onClick={() => onPageChange(item.page)}
                  isRed={item.isRed}
                />
              ))}
            </ul>
          </div>
        ))}

        <div className="pt-4 border-t border-white/20">
          <ul className="space-y-2">
            <NavItem
              icon={logoutItem.icon}
              label={logoutItem.label}
              onClick={handleLogout}
              isRed={logoutItem.isRed}
            />
          </ul>
        </div>
      </nav>
    </aside>
  );
}
