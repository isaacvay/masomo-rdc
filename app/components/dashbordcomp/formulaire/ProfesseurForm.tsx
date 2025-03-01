"use client";
import React, { useState, useMemo } from "react";
import { auth, firestore } from "@/config/firebase";
import { secondaryAuth } from "@/config/firebaseSecondary";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { sections } from "@/data/cours";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Mail,
  Lock,
  Hash,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// Fonction utilitaire pour générer un mot de passe aléatoire
const generateRandomPassword = (length = 8): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
};

export default function AddProfesseur() {
  const router = useRouter();
  const [professeur, setProfesseur] = useState<string>("");
  const [sexe, setSexe] = useState<string>("");
  const [courses, setCourses] = useState<string[]>([]);
  const [courseSearchTerm, setCourseSearchTerm] = useState<string>("");
  const [currentCourse, setCurrentCourse] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [generatedPassword, setGeneratedPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Utiliser useMemo pour calculer la liste des options une seule fois
  const courseOptions: string[] = useMemo(() => {
    return Array.from(new Set(
      sections.flatMap(section => section.subjects.map(subject => subject.name))
    ));
  }, []);

  const filteredCourseOptions = courseOptions.filter((course) =>
    course.toLowerCase().includes(courseSearchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!auth.currentUser) {
      alert("Veuillez vous connecter en tant qu'école pour ajouter un professeur.");
      setLoading(false);
      return;
    }
    try {
      // Génération du mot de passe et de l'email du professeur
      const password = generateRandomPassword();
      setGeneratedPassword(password);
      const email = `${professeur.toLowerCase().replace(/\s+/g, "")}@prof.masomordc.cd`;

      // Création du compte avec l'instance secondaire
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password
      );
      const user = userCredential.user;

      // Mise à jour du profil du professeur avec son nom
      await updateProfile(user, { displayName: professeur });

      // Récupérer l'UID de l'école (compte connecté)
      const schoolId = auth.currentUser.uid;

      // Préparation des données du professeur pour le document "users"
      const profData = {
        uid: user.uid,
        role: "professeur",
        displayName: professeur,
        email,
        sexe,
        courses, // Liste des cours assignés
        schoolId, // Lien avec l'école
        password, // Ajout du mot de passe
        createdAt: new Date(),
      };

      // Enregistrement dans la collection "users"
      await setDoc(doc(firestore, "users", user.uid), profData);

      // Déconnexion de l'instance secondaire pour ne pas affecter la session école
      await signOut(secondaryAuth);

      alert(`Professeur ajouté avec succès !
Email : ${email}
Mot de passe : ${password}`);

      // Réinitialisation des champs
      setProfesseur("");
      setSexe("");
      setCourses([]);
      setCurrentCourse("");
      setCourseSearchTerm("");
      setGeneratedPassword("");
      router.push("/dashboardProf");
    } catch (error: unknown) {
      let errorMessage = "Une erreur est survenue";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error("Erreur lors de l'ajout du professeur :", error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-md mt-10">
      <h2 className="text-xl font-bold mb-6 text-center">Ajouter un Professeur</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-600 text-sm">{error}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Champ pour le nom */}
        <div className="mb-4">
          <label htmlFor="professeur" className="block text-gray-700 font-semibold mb-1">
            Nom du professeur :
          </label>
          <input
            type="text"
            id="professeur"
            value={professeur}
            onChange={(e) => setProfesseur(e.target.value)}
            placeholder="Nom du professeur"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Champ pour le sexe */}
        <div className="mb-4">
          <label htmlFor="sexe" className="block text-gray-700 font-semibold mb-1">
            Sexe :
          </label>
          <select
            id="sexe"
            value={sexe}
            onChange={(e) => setSexe(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">-- Sélectionnez --</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>
        </div>

        {/* Sélection des cours */}
        <div className="mb-4 relative">
          <label htmlFor="courseSearch" className="block text-gray-700 font-semibold mb-1">
            Sélectionner un cours :
          </label>
          <div className="flex">
            <input
              type="text"
              id="courseSearch"
              value={courseSearchTerm}
              onChange={(e) => {
                setCourseSearchTerm(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Rechercher un cours..."
              className="w-full px-3 py-2 border border-gray-300 rounded-l-md"
            />
            <button
              type="button"
              onClick={() => {
                const trimmed = currentCourse.trim();
                if (trimmed !== "" && !courses.includes(trimmed)) {
                  setCourses([...courses, trimmed]);
                  setCurrentCourse("");
                  setCourseSearchTerm("");
                }
              }}
              className="bg-green-500 text-white px-4 py-2 rounded-r-md"
            >
              Ajouter
            </button>
          </div>
          {dropdownOpen && (
            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-auto">
              {filteredCourseOptions.length > 0 ? (
                filteredCourseOptions.map((course) => (
                  <li
                    key={course}
                    onClick={() => {
                      setCurrentCourse(course);
                      setCourseSearchTerm(course);
                      setDropdownOpen(false);
                    }}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {course}
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-gray-500">Aucun cours trouvé</li>
              )}
            </ul>
          )}
        </div>

        {courses.length > 0 && (
          <div className="mb-6">
            <h3 className="text-gray-700 font-semibold mb-2">Cours ajoutés :</h3>
            <ul>
              {courses.map((course, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center mb-1 px-3 py-1 border border-gray-200 rounded-md"
                >
                  <span>{course}</span>
                  <button
                    type="button"
                    onClick={() => setCourses(courses.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-700"
                  >
                    Supprimer
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" />
              Création du compte...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              Enregistrer le professeur
            </>
          )}
        </button>
      </form>
    </div>
  );
}
