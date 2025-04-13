"use client";
import React, { useEffect, useState, useMemo } from "react";
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
  ClipboardDocumentListIcon,
  ClockIcon,
  DocumentTextIcon,
  TableCellsIcon
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { Briefcase, CalendarDays, UserCircleIcon, BookCheck, BookKey, BookTemplate } from "lucide-react";

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

interface NavSection {
  title: string;
  items: NavItemData[];
}

const useUserData = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTitulaire, setIsTitulaire] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const userData = {
              name: data.displayName || firebaseUser.email || "Utilisateur",
              role: data.role || "Utilisateur",
              secondRole: data.secondRole || null,
              schoolId: data.schoolId || null,
            };

            if (userData.role === "professeur" && userData.schoolId) {
              const titulairesRef = collection(db, "schools", userData.schoolId, "titulaires");
              const q = query(titulairesRef, where("professeur", "==", userData.name));
              const snapshot = await getDocs(q);
              setIsTitulaire(!snapshot.empty);
            }

            setUser(userData);
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
        } else {
          setUser(null);
        }
      } catch (err) {
        setError("Erreur de chargement des données utilisateur");
        console.error(err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [db]);

  return { user, loading, isTitulaire, error };
};

const NavItem = React.memo(({
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
      aria-label={label}
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
));

NavItem.displayName = 'NavItem';

interface NavleftProps {
  onPageChange: (page: string) => void;
}

const Navleft = ({ onPageChange }: NavleftProps) => {
  const router = useRouter();
  const { user, loading, isTitulaire, error } = useUserData();

  // Navigation Principale
  const mainNavItems: NavItemData[] = useMemo(() => [
    { icon: <HomeIcon className="h-6 w-6" />, label: "Accueil", page: "Accueil" },
    { icon: <Cog6ToothIcon className="h-6 w-6" />, label: "Paramètres", page: "Parametres" },
  ], []);

  // Espace Professeur
  const teacherNavItems: NavItemData[] = useMemo(() => [
    { icon: <ClipboardDocumentListIcon className="h-6 w-6" />, label: "Saisie des notes", page: "SaisieDeNotes" },
    { icon: <DocumentTextIcon className="h-6 w-6" />, label: "Devoirs", page: "devoirProf" },
    { icon: <CalendarDays className="h-6 w-6" />, label: "Planning", page: "horaireProf" },
    { icon: <BookOpenIcon className="h-6 w-6" />, label: "Mes cours", page: "ListeDesCours" },
    { icon: <ClockIcon className="h-6 w-6" />, label: "Examens", page: "HorairedesexamensProf" },
  ], []);

  // Espace Élève
  const studentNavItems: NavItemData[] = useMemo(() => [
    { icon: <AcademicCapIcon className="h-6 w-6" />, label: "Bulletin", page: "bulletin" },
    { icon: <CalendarDays className="h-6 w-6" />, label: "Horaire", page: "horaireEleve" },
    { icon: <BookCheck className="h-6 w-6" />, label: "Devoirs", page: "devoirEleve" },
    { icon: <BookTemplate className="h-6 w-6" />, label: "Cours", page: "cours" },
    { icon: <ClockIcon className="h-6 w-6" />, label: "Examens", page: "HorairedesexamensEleve" },
  ], []);

  // Espace Titulaire
  const titulaireNavItems: NavItemData[] = useMemo(() => [
    { icon: <TableCellsIcon className="h-6 w-6" />, label: "Gestion", page: "listeclasses" },
  ], []);

  // Administration Scolaire
  const schoolNavItems: NavItemData[] = useMemo(() => [
    { icon: <UserPlusIcon className="h-6 w-6" />, label: "Inscriptions", page: "EnregistrementEleve" },
    { icon: <UsersIcon className="h-6 w-6" />, label: "Enseignants", page: "EnregistrementProfesseur" },
    { icon: <BookKey className="h-6 w-6" />, label: "Programmation", page: "ClassesEtCours" },
    { icon: <UsersIcon className="h-6 w-6" />, label: "Personnel", page: "listeprof" },
    { icon: <ChartBarIcon className="h-6 w-6" />, label: "Effectifs", page: "elevesparclasse" },
  ], []);

  // Comptabilité
  const comptableNavItems: NavItemData[] = useMemo(() => [
    { icon: <UserPlusIcon className="h-6 w-6" />, label: "Inscriptions", page: "EnregistrementEleve" },
    { icon: <ChartBarIcon className="h-6 w-6" />, label: "Statistiques", page: "elevesparclasse" },
    { icon: <TableCellsIcon className="h-6 w-6" />, label: "Finances", page: "finances" },
  ], []);

  const logoutItem: NavItemData = useMemo(() => ({
    icon: <ArrowLeftOnRectangleIcon className="h-6 w-6" />,
    label: "Déconnexion",
    page: "Deconnexion",
    isRed: true,
  }), []);

  const getNavSections = (): NavSection[] => {
    const sections: NavSection[] = [{ title: "Navigation", items: mainNavItems }];

    if (!user) return sections;

    if (user.role === "professeur" && user.secondRole === "comptable") {
      sections.push({ title: "Comptabilité", items: comptableNavItems });
    }

    if (user.role === "professeur") {
      sections.push({ title: "Enseignement", items: teacherNavItems });
      if (isTitulaire) {
        sections.push({ title: "Titulariat", items: titulaireNavItems });
      }
    }

    if (user.role === "élève") {
      sections.push({ title: "Scolarité", items: studentNavItems });
    }

    if (user.role === "école") {
      sections.push({ title: "Administration", items: schoolNavItems });
    }

    return sections;
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (err) {
      console.error("Erreur lors de la déconnexion:", err);
    }
  };

  if (loading) {
    return (
      <div className="w-64 p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="w-64 p-6 text-red-500">{error}</div>;
  }

  const navSections = getNavSections();

  return (
    <aside className="w-64 transform scale-90 md:scale-100 p-6 mt-5 ml-4 mr-4 bg-white/10 backdrop-blur-md shadow-xl border-r border-white/20">
      {user && (
        <div className="flex items-center space-x-4 p-2 bg-white/20 rounded-xl mb-10">
          <UserCircleIcon className="h-12 w-12 text-cyan-400" />
          <div>
            <p className="text-sm font-semibold text-white uppercase">{user.name}</p>
            <p className="text-sm text-gray-300">{user.role}</p>
            {user.secondRole && <p className="text-xs text-gray-400">{user.secondRole}</p>}
          </div>
        </div>
      )}

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
};

export default React.memo(Navleft);
