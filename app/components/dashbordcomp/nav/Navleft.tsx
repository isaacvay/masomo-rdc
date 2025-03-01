"use client";
import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/config/firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import {
  UserCircleIcon,
  Cog6ToothIcon,
  HomeIcon,
  ArrowLeftOnRectangleIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UserPlusIcon,
  UsersIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { Briefcase } from "lucide-react";

interface NavleftProps {
  onPageChange: (page: string) => void;
}

interface AppUser {
  name: string;
  role: string;
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
  { icon: <BookOpenIcon className="h-6 w-6" />, label: "Liste des cours", page: "ListeDesCours" },
  { icon: <UsersIcon className="h-6 w-6" />, label: "Liste des élèves", page: "listeclasses" },
];

const studentNavItems: NavItemData[] = [
  { icon: <BookOpenIcon className="h-6 w-6" />, label: "Bulletin", page: "bulletin" },
  { icon: <Briefcase className="h-6 w-6" />, label: "Cours", page: "cours" },
];

const schoolNavItems: NavItemData[] = [
  { icon: <UserPlusIcon className="h-6 w-6" />, label: "Enregistrement Prof", page: "EnregistrementProfesseur" },
  { icon: <UserPlusIcon className="h-6 w-6" />, label: "Enregistrement Élève", page: "EnregistrementEleve" },
    { icon: <AcademicCapIcon className="h-6 w-6" />, label: "Classes et Cours", page: "ClassesEtCours" },
  { icon: <UsersIcon className="h-6 w-6" />, label: "Liste des profs", page: "listeprof" },
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
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Récupérer les données de l'utilisateur depuis la collection "users"
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const name = data.displayName || firebaseUser.email || "Utilisateur";
          const role = data.role || "Utilisateur";
          setUser({ name, role });
        } else {
          // En déduisant le rôle par le domaine de l'e-mail
          let name = firebaseUser.displayName || firebaseUser.email || "Utilisateur";
          let role = "Utilisateur";
          if (firebaseUser.email) {
            const email = firebaseUser.email.toLowerCase().trim();
            if (email.endsWith("@prof.masomordc.cd")) {
              role = "professeur";
            } else if (email.endsWith("@elev.masomordc.cd")) {
              role = "élève";
            } else if (email.endsWith("@ecole.masomordc.cd")) {
              role = "ecole";
            }
          }
          setUser({ name, role });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db]);

  if (loading) {
    return <div>Chargement...</div>;
  }

  const displayName = user?.name || "Utilisateur";
  const displayRole = user?.role || "Rôle inconnu";

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const navSections: { title: string; items: NavItemData[] }[] = [
    { title: "Navigation", items: mainNavItems },
  ];

  if (user?.role === "professeur") {
    navSections.push({ title: "Pédagogie", items: teacherNavItems });
  } else if (user?.role === "élève") {
    navSections.push({ title: "Bulletin", items: studentNavItems });
  } else if (user?.role === "ecole") {
    navSections.push({ title: "Scolarité", items: schoolNavItems });
  }

  return (
    <aside className="w-64 transform scale-90 md:scale-100 p-6 mt-5 ml-4 mr-4 bg-white/10 backdrop-blur-md shadow-xl border-r border-white/20">
      {/* Profil */}
      <div className="flex items-center space-x-4 p-2 bg-white/20 rounded-xl mb-10">
        <UserCircleIcon className="h-12 w-12 text-cyan-400" />
        <div>
          <p className="text-sm font-semibold text-white uppercase">{displayName}</p>
          <p className="text-sm text-gray-300">{displayRole}</p>
        </div>
      </div>

      {/* Navigation */}
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

        {/* Déconnexion */}
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
