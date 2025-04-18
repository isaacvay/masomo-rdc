"use client";

import React, { useState, useEffect, useMemo } from "react";
import { sections, Section } from "@/data/cours";
import { colors } from "@/data/colors";
import { auth, firestore } from "@/config/firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { FiSearch, FiDollarSign, FiUsers, FiBook, FiChevronRight, FiFilter } from "react-icons/fi";
import { motion } from "framer-motion";

interface Student {
  eleve: string;
  classe: string;
  schoolId: string;
  role: string;
}

interface UserDoc {
  role?: string;
  secondRole?: string;
  schoolId?: string;
}

interface FinanceClassesProps {
  onClassSelect: (className: string) => void;
}

const groupByCategory = (sections: Section[]) => {
  const grouped: { [key: string]: { category: string; classes: string[] } } = {};

  sections.forEach((section) => {
    if (!grouped[section.category]) {
      grouped[section.category] = { category: section.category, classes: [] };
    }
    section.classe.forEach((classe) => {
      if (!grouped[section.category].classes.includes(classe)) {
        grouped[section.category].classes.push(classe);
      }
    });
  });

  return Object.values(grouped);
};

const FinanceClasses: React.FC<FinanceClassesProps> = ({ onClassSelect }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Toutes");
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        let schoolId = auth.currentUser?.uid || "";
        const userRef = doc(firestore, "users", auth.currentUser?.uid || "");
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data() as UserDoc;
          if (
            userData.role === "professeur" &&
            userData.secondRole === "comptable" &&
            userData.schoolId
          ) {
            schoolId = userData.schoolId;
          }
        }

        const usersRef = collection(firestore, "users");
        const q = query(
          usersRef,
          where("schoolId", "==", schoolId),
          where("role", "==", "élève")
        );
        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => doc.data() as Student);
        setStudents(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const countStudentsInClass = (className: string) =>
    students.filter((s) => s.classe === className).length;

  const availableCategories = useMemo(() => {
    const categoriesWithStudents = new Set<string>();
    const grouped = groupByCategory(sections);

    grouped.forEach((section) => {
      const hasClassesWithStudents = section.classes.some(
        (cl) => countStudentsInClass(cl) > 0
      );
      
      if (hasClassesWithStudents) {
        categoriesWithStudents.add(section.category);
      }
    });

    return ["Toutes", ...Array.from(categoriesWithStudents)];
  }, [students]);

  const filteredSections = groupByCategory(sections)
    .map((section) => ({
      ...section,
      classes: section.classes.filter((cl) => {
        const hasStudents = countStudentsInClass(cl) > 0;
        const matchesSearch = cl.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             section.category.toLowerCase().includes(searchTerm.toLowerCase());
        return hasStudents && matchesSearch;
      }),
    }))
    .filter((section) => section.classes.length > 0)
    .filter((section) => selectedCategory === "Toutes" || section.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-16 w-16 rounded-full border-4 border-blue-500 border-t-transparent"
        />
        <p className="mt-4 text-gray-600 font-medium">Chargement des données...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md p-6 bg-white rounded-xl shadow-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion Financière</h1>
              <p className="text-gray-600 mt-1">Suivi des paiements par classe</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher une classe ou catégorie..."
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <FiFilter className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">{selectedCategory}</span>
                </button>
                {showCategoryFilter && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border border-gray-200"
                  >
                    <div className="py-1 max-h-60 overflow-auto">
                      {availableCategories.map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            setSelectedCategory(category);
                            setShowCategoryFilter(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            selectedCategory === category
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <FiUsers className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Élèves total</p>
                <p className="text-2xl font-semibold text-gray-900">{students.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <FiDollarSign className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Classes actives</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {filteredSections.reduce((acc, section) => acc + section.classes.length, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <FiBook className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Catégories</p>
                <p className="text-2xl font-semibold text-gray-900">{filteredSections.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Classes List */}
        {filteredSections.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100"
          >
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Aucune classe trouvée</h3>
            <p className="mt-1 text-gray-500">
              {selectedCategory === "Toutes"
                ? "Aucune classe ne correspond à votre recherche ou ne contient d'élèves."
                : `Aucune classe dans la catégorie "${selectedCategory}" ne correspond à votre recherche.`}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {filteredSections.map((section, idx) => (
              <motion.div 
                key={section.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
              >
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-3 ${colors[idx % colors.length]}`} />
                  <h2 className="text-lg font-semibold text-gray-900">{section.category}</h2>
                  <span className="ml-3 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                    {section.classes.length} classes
                  </span>
                  <span className="ml-auto text-sm text-gray-500">
                    {section.classes.reduce((acc, cl) => acc + countStudentsInClass(cl), 0)} élèves
                  </span>
                </div>

                <div className="divide-y divide-gray-100">
                  {section.classes.map((classe) => (
                    <motion.button
                      key={classe}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => onClassSelect(classe)}
                      className="w-full px-6 py-4 flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                          <FiBook className="h-4 w-4 text-gray-500" />
                        </div>
                        <span className="text-gray-800 font-medium">{classe}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-3">
                          {countStudentsInClass(classe)} élève{countStudentsInClass(classe) > 1 ? 's' : ''}
                        </span>
                        <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                          <FiChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceClasses;