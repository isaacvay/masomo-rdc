"use client";
import React, { useState, useMemo } from "react";
import {
  UserCircle,
  Calendar,
  BookOpen,
  Key,
  Mail,
  Eye,
  EyeOff,
  Users,
  ArrowLeft,
  Hash,
  Copy,
  Check,
} from "lucide-react";
import { auth, firestore } from "@/config/firebase";
import { doc, setDoc } from "firebase/firestore";
import { sections } from "@/data/cours";

// Fonction utilitaire pour générer une chaîne aléatoire (utilisée ici pour le bulletinId)
const generateRandomPassword = (length = 8): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
};

interface ProfileEleveProps {
  uid: string; // UID du document dans "users"
  displayName: string;
  sexe: string;
  neEA: string;
  naissance: string;
  section: string;
  classe: string;
  numPerm: string;
  email: string;
  password: string;
  bulletinId: string;
  onRetour: () => void;
}

export default function ProfileEleve({
  uid,
  displayName,
  sexe,
  neEA,
  naissance,
  section,
  classe,
  numPerm,
  email,
  password,
  bulletinId,
  onRetour,
}: ProfileEleveProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editableProfile, setEditableProfile] = useState({
    displayName,
    sexe,
    neEA,
    naissance,
    section,
    classe,
    numPerm,
    email,
    bulletinId,
  });
  const [copiedField, setCopiedField] = useState<"email" | "password" | null>(null);

  // Options pour les sélecteurs
  const sexeOptions = ["M", "F"];
  const sectionOptions = useMemo(
    () => Array.from(new Set(sections.map((sec) => sec.category))),
    []
  );
  const classeOptions = useMemo(() => {
    return editableProfile.section
      ? sections
          .filter((sec) => sec.category === editableProfile.section)
          .flatMap((sec) => sec.classe)
      : [];
  }, [editableProfile.section]);

  const handleChange = (field: string, value: string) => {
    if (field === "section") {
      // Changement de section : on réinitialise la classe (mais pas le bulletinId)
      setEditableProfile((prev) => ({ ...prev, section: value, classe: "" }));
    } else if (field === "classe") {
      // Changement de classe : on met à jour la classe ET on génère un nouveau bulletinId
      setEditableProfile((prev) => ({
        ...prev,
        classe: value,
        bulletinId: generateRandomPassword(10),
      }));
    } else {
      setEditableProfile((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleCopy = async (text: string, field: "email" | "password") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Échec de la copie :", error);
    }
  };

  const handleSave = async () => {
    try {
      console.log("Mise à jour de l'utilisateur", { uid, editableProfile });
      const userRef = doc(firestore, "users", uid);
      await setDoc(userRef, { ...editableProfile }, { merge: true });
      console.log("Mise à jour réussie");
      setEditMode(false);
      alert("Profil mis à jour avec succès !");
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du profil :", error);
      alert("Erreur lors de la mise à jour du profil : " + error.message);
    }
  };

  return (
    <div className="min-h-screen sm:p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl">
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-8">
          <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm rounded-full p-2">
            <ArrowLeft onClick={onRetour} className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <UserCircle className="h-20 w-20 text-white/90 stroke-1" />
            <div className="space-y-2 text-center sm:text-left">
              {editMode ? (
                <input
                  value={editableProfile.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  className="text-3xl font-bold bg-transparent text-white border-b-2 border-white/30 focus:outline-none focus:border-white/80 text-center sm:text-left"
                />
              ) : (
                <h1 className="text-3xl font-bold text-white">{editableProfile.displayName}</h1>
              )}
              <p className="text-indigo-200 font-medium flex items-center gap-2">
                <span className="bg-white/10 px-3 py-1 rounded-full">Profil Élève</span>
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 sm:p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <SectionTitle icon={<UserCircle className="h-5 w-5" />} title="Informations Personnelles" />
              <EditableField
                editMode={editMode}
                label="Sexe"
                icon={<Users className="h-5 w-5" />}
                value={editableProfile.sexe}
                onChange={(v) => handleChange("sexe", v)}
                options={sexeOptions}
              />
              <EditableField
                editMode={editMode}
                label="Né(e) à"
                icon={<BookOpen className="h-5 w-5" />}
                value={editableProfile.neEA}
                onChange={(v) => handleChange("neEA", v)}
                inputType="text"
              />
              <EditableField
                editMode={editMode}
                label="Date de naissance"
                icon={<Calendar className="h-5 w-5" />}
                value={editableProfile.naissance}
                onChange={(v) => handleChange("naissance", v)}
                inputType="date"
              />
            </div>
            <div className="space-y-6">
              <SectionTitle icon={<BookOpen className="h-5 w-5" />} title="Scolarité" />
              <EditableField
                editMode={editMode}
                label="Section"
                icon={<Hash className="h-5 w-5" />}
                value={editableProfile.section}
                onChange={(v) => handleChange("section", v)}
                options={sectionOptions}
              />
              <EditableField
                editMode={editMode}
                label="Classe"
                icon={<Hash className="h-5 w-5" />}
                value={editableProfile.classe}
                onChange={(v) => handleChange("classe", v)}
                options={classeOptions}
              />
              <EditableField
                editMode={editMode}
                label="Numéro permanent"
                icon={<Hash className="h-5 w-5" />}
                value={editableProfile.numPerm}
                onChange={(v) => handleChange("numPerm", v)}
              />
            </div>
          </div>
          <div className="space-y-6">
            <SectionTitle icon={<Key className="h-5 w-5" />} title="Identifiants" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EditableField
                editMode={false}
                label="Email"
                icon={<Mail className="h-5 w-5" />}
                value={editableProfile.email}
                inputType="email"
                onChange={() => {}}
                onCopy={() => handleCopy(editableProfile.email, "email")}
                copied={copiedField === "email"}
                // Sur mobile, le texte est réduit (text-xs) et passe à text-base à partir du breakpoint sm.
                customValueClass="text-xs sm:text-base text-gray-900 font-medium"
              />
              <div className="group relative p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-500">Mot de passe</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-gray-900">
                        {showPassword ? password : "•".repeat(12)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                      aria-label={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => handleCopy(password, "password")}
                      className="text-gray-400 hover:text-indigo-600 relative transition-colors"
                      aria-label="Copier le mot de passe"
                    >
                      <Copy className="h-5 w-5" />
                      {copiedField === "password" && (
                        <Check className="h-4 w-4 text-green-500 absolute -top-1 -right-1" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 justify-end border-t pt-6">
            {editMode ? (
              <>
                <Button onClick={handleSave} variant="success">
                  Sauvegarder
                </Button>
                <Button
                  onClick={() => {
                    setEditMode(false);
                    // Réinitialisation en cas d'annulation
                    setEditableProfile({
                      displayName,
                      sexe,
                      neEA,
                      naissance,
                      section,
                      classe,
                      numPerm,
                      email,
                      bulletinId,
                    });
                  }}
                  variant="secondary"
                >
                  Annuler
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditMode(true)} variant="primary">
                Modifier
              </Button>
            )}
            <Button onClick={onRetour} variant="neutral">
              Retour
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
    <div className="text-indigo-600">{icon}</div>
    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
  </div>
);

interface EditableFieldProps {
  editMode: boolean;
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  inputType?: string;
  onCopy?: () => void;
  copied?: boolean;
  options?: string[];
  // Prop pour personnaliser la classe du texte affiché (utilisée ici pour l'email)
  customValueClass?: string;
}

const EditableField = ({
  editMode,
  label,
  icon,
  value,
  onChange,
  inputType = "text",
  onCopy,
  copied,
  options,
  customValueClass,
}: EditableFieldProps) => {
  // Classe par défaut pour le rendu du texte si aucune classe personnalisée n'est fournie
  const displayClass = customValueClass || "text-gray-900 font-medium";
  return (
    <div className="group relative p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <label className="text-sm font-medium text-gray-500">{label}</label>
      <div className="mt-1 flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="text-indigo-600">{icon}</div>
          {editMode ? (
            options ? (
              <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-transparent border-b-2 border-gray-300 focus:border-indigo-500 focus:outline-none py-1 px-2"
              >
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={inputType}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-transparent border-b-2 border-gray-300 focus:border-indigo-500 focus:outline-none py-1 px-2"
              />
            )
          ) : (
            <span className={displayClass}>{value}</span>
          )}
        </div>
        {!editMode && onCopy && (
          <button
            onClick={onCopy}
            className="text-gray-400 hover:text-indigo-600 relative transition-colors"
            aria-label="Copier"
          >
            <Copy className="h-5 w-5" />
            {copied && <Check className="h-4 w-4 text-green-500 absolute -top-1 -right-1" />}
          </button>
        )}
      </div>
    </div>
  );
};

const Button = ({
  children,
  onClick,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "success" | "neutral";
}) => {
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white",
    secondary: "bg-yellow-500 hover:bg-yellow-600 text-white",
    success: "bg-green-500 hover:bg-green-600 text-white",
    neutral: "bg-gray-500 hover:bg-gray-600 text-white",
  };
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${variants[variant]}`}
    >
      {children}
    </button>
  );
};
