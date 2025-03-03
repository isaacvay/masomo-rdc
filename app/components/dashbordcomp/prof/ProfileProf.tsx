import React, { useState, useCallback } from "react";
import { auth, firestore } from "@/config/firebase";
import { updateDoc, doc } from "firebase/firestore";
import { sections } from "@/data/cours";
import {
  UserCircle,
  Mail,
  Lock,
  BookOpen,
  VenusAndMars,
  XCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";

interface Prof {
  id: string;
  displayName: string;
  email?: string;
  password?: string;
  sexe?: string;
  courses?: string[];
}

interface ProfileProfProps extends Prof {
  onRetour: () => void;
}

export default function ProfileProf({ id, displayName, email, password, sexe, courses, onRetour }: ProfileProfProps) {
  const courseOptions = Array.from(
    new Set(sections.flatMap(section => section.subjects.map(subject => subject.name)))
  );

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    displayName: displayName,
    email: email || "",
    sexe: sexe || "",
    password: password || "",
    courses: courses || [] as string[],
  });
  const [status, setStatus] = useState<{ loading: boolean; error: string | null; success: boolean }>({ 
    loading: false, 
    error: null, 
    success: false 
  });
  const [courseSearch, setCourseSearch] = useState({ term: "", open: false });
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<"email" | "password" | null>(null);

  const filteredCourses = courseOptions.filter(course =>
    course.toLowerCase().includes(courseSearch.term.toLowerCase())
  );

  const handleSave = useCallback(async () => {
    try {
      setStatus({ loading: true, error: null, success: false });
      // Mise à jour du document du professeur dans la collection "users"
      const profRef = doc(firestore, "users", id);
      await updateDoc(profRef, formData);
      
      setStatus(prev => ({ ...prev, loading: false, success: true }));
      setTimeout(() => setStatus(prev => ({ ...prev, success: false })), 3000);
      setEditMode(false);
    } catch (err: any) {
      setStatus(prev => ({ ...prev, error: err.message, loading: false }));
    }
  }, [formData, id]);

  const handleCourseAdd = useCallback((course: string) => {
    const trimmed = course.trim();
    if (trimmed && !formData.courses.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        courses: [...prev.courses, trimmed]
      }));
    }
    setCourseSearch({ term: "", open: false });
  }, [formData.courses]);

  const handleCopy = useCallback(async (text: string, field: "email" | "password") => {
    try {
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      setStatus(prev => ({ ...prev, error: "Échec de la copie" }));
    }
  }, []);

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <button 
        onClick={onRetour}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
      >
        <XCircle className="h-5 w-5" />
        <span>Retour à la liste</span>
      </button>

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8">
          <div className="flex items-center gap-6">
            <UserCircle className="h-16 w-16 text-white/90 stroke-1" />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">
                {editMode ? (
                  <input
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    className="bg-transparent border-b-2 border-white/30 focus:border-white/80 focus:outline-none"
                  />
                ) : (
                  formData.displayName
                )}
              </h1>
              <p className="text-indigo-200 font-medium">Profil Enseignant</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {status.error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3">
              <XCircle className="h-5 w-5" />
              {status.error}
            </div>
          )}
          
          {status.success && (
            <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-3">
              <CheckCircle className="h-5 w-5" />
              Profil mis à jour avec succès
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <SectionTitle icon={<UserCircle className="h-5 w-5" />} title="Informations" />
              
              <EditableField
                editMode={false}
                label="Email"
                icon={<Mail className="h-5 w-5" />}
                value={formData.email}
                type="email"
                onCopy={() => handleCopy(formData.email, "email")}
                copied={copiedField === "email"}
              />

              <EditableField
                editMode={editMode}
                label="Sexe"
                icon={<VenusAndMars className="h-5 w-5" />}
                value={formData.sexe}
                onChange={(v) => setFormData(prev => ({ ...prev, sexe: v }))}
              />
            </div>

            <div className="space-y-6">
              <SectionTitle icon={<Lock className="h-5 w-5" />} title="Sécurité" />
              
              <EditableField
                editMode={false}
                label="Mot de passe"
                icon={<Lock className="h-5 w-5" />}
                value={formData.password}
                type="password"
                masked
                onCopy={() => handleCopy(formData.password, "password")}
                showPassword={showPassword}
                togglePassword={() => setShowPassword(!showPassword)}
                copied={copiedField === "password"}
              />
            </div>
          </div>

          <div className="space-y-6">
            <SectionTitle icon={<BookOpen className="h-5 w-5" />} title="Cours attribués" />
            
            {editMode ? (
              <div className="space-y-4">
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={courseSearch.term}
                      onChange={(e) => setCourseSearch(prev => ({ ...prev, term: e.target.value }))}
                      onFocus={() => setCourseSearch(prev => ({ ...prev, open: true }))}
                      placeholder="Rechercher un cours..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => handleCourseAdd(courseSearch.term)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Ajouter
                    </button>
                  </div>

                  {courseSearch.open && (
                    <ul className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredCourses.map(course => (
                        <li
                          key={course}
                          onClick={() => handleCourseAdd(course)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          {course}
                        </li>
                      ))}
                      {filteredCourses.length === 0 && (
                        <li className="px-4 py-3 text-gray-500">Aucun résultat</li>
                      )}
                    </ul>
                  )}
                </div>

                {formData.courses.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {formData.courses.map((course, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg"
                      >
                        <span>{course}</span>
                        <button
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            courses: prev.courses.filter((_, i) => i !== index)
                          }))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {formData.courses.length > 0 ? (
                  formData.courses.map((course, index) => (
                    <div key={index} className="px-4 py-2 bg-gray-50 rounded-lg">
                      {course}
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500">Aucun cours attribué</span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 justify-end border-t pt-6">
            {editMode ? (
              <>
                <Button 
                  onClick={handleSave} 
                  disabled={status.loading}
                  variant="success"
                >
                  {status.loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Sauvegarder"
                  )}
                </Button>
                <Button 
                  onClick={() => {
                    setEditMode(false);
                    setStatus({ loading: false, error: null, success: false });
                  }}
                  variant="secondary"
                >
                  Annuler
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => setEditMode(true)}
                variant="primary"
              >
                Modifier le profil
              </Button>
            )}
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

const EditableField = ({
  editMode,
  label,
  icon,
  value,
  onChange,
  type = "text",
  masked = false,
  onCopy,
  showPassword,
  togglePassword,
  copied
}: {
  editMode: boolean;
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  masked?: boolean;
  onCopy?: () => void;
  showPassword?: boolean;
  togglePassword?: () => void;
  copied?: boolean;
}) => (
  <div className="group relative p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <label className="block text-sm font-medium text-gray-500 mb-2">{label}</label>
    <div className="flex items-center gap-3 justify-between">
      <div className="flex items-center gap-3 flex-1">
        <div className="text-indigo-600">{icon}</div>
        {editMode && onChange ? (
          <div className="relative flex-1">
            <input
              type={type === "password" ? (showPassword ? "text" : "password") : type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full bg-transparent border-b-2 border-gray-300 focus:border-indigo-500 focus:outline-none py-1 px-2"
            />
            {type === "password" && togglePassword && (
              <button
                type="button"
                onClick={togglePassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            )}
          </div>
        ) : (
          <span className="text-gray-900 font-medium flex-1">
            {masked && !showPassword ? "•".repeat(8) : value || "Non renseigné"}
          </span>
        )}
      </div>
      
      {!editMode && (
        <div className="flex items-center gap-2">
          {masked && togglePassword && (
            <button
              onClick={togglePassword}
              className="text-gray-400 hover:text-indigo-600 transition-colors"
              aria-label={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          )}
          {onCopy && (
            <button
              onClick={onCopy}
              className="text-gray-400 hover:text-indigo-600 relative transition-colors"
              aria-label="Copier"
              disabled={!value}
            >
              <Copy className="h-5 w-5" />
              {copied && (
                <span className="absolute -right-2 -top-2">
                  <Check className="h-4 w-4 text-green-500" />
                </span>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  </div>
);

const Button = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success';
  disabled?: boolean;
}) => {
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-gray-300 hover:bg-gray-400 text-gray-800',
    success: 'bg-green-500 hover:bg-green-600 text-white'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
        variants[variant]
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};
