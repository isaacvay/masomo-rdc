"use client";
import { useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { sections } from "@/data/cours";
import { Bulletin } from "@/app/components/verify/BulletinTypes";
import { CheckIcon, ExclamationTriangleIcon, QrCodeIcon } from "@/app/components/verify/VerificateurBulletinIcons";
import BulletinDisplay from "@/app/components/verify/BulletinDisplay";

export default function VerificateurBulletin() {
  const [code, setCode] = useState("");
  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  // Récupération du bulletinId via le query parameter
  const searchParams = useSearchParams();
  const bulletinIdFromQuery = searchParams.get("bulletinId");

  const fetchBulletin = async (bulletinId: string) => {
    setError("");
    setBulletin(null);
    try {
      const bulletinDocRef = doc(firestore, "publicBulletins", bulletinId);
      const bulletinDocSnap = await getDoc(bulletinDocRef);

      if (bulletinDocSnap.exists()) {
        const data = bulletinDocSnap.data();

        console.log("Données Firestore :", data);

        // Traitement des matières (flattenedSubjects)
        let flattenedSubjects = data.flattenedSubjects;
        if (!flattenedSubjects || flattenedSubjects.length === 0) {
          const newFlattenedSubjects = Object.keys(data.grades).map((subjectName) => {
            const coursSubjects = sections.flatMap((section) => section.subjects);
            const coursSubject = coursSubjects.find((subject) => subject.name === subjectName);

            return {
              name: subjectName,
              maxima: [
                coursSubject?.maxima[0] ?? 0,
                coursSubject?.maxima[1] ?? 0,
                coursSubject?.maxima[2] ?? 0,
                coursSubject?.maxima[3] ?? 0,
                coursSubject?.maxima[4] ?? 0,
                coursSubject?.maxima[5] ?? 0,
                coursSubject?.maxima[6] ?? 0,
                coursSubject?.maxima[7] ?? 0,
              ],
            };
          });

          flattenedSubjects = newFlattenedSubjects;
        }

        // Traitement des notes
        let gradesMapping: Record<string, (number | null)[]> = data.gradesMapping;
        if (!gradesMapping || Object.keys(gradesMapping).length === 0) {
          gradesMapping = data.grades;
        }

        const bulletinData: Bulletin = {
          id: bulletinDocSnap.id,
          Student: data.student || {
            displayName: "",
            sexe: "",
            neEA: "",
            naissance: "",
            classe: "",
            section: "",
            numPerm: "",
          },
          school: data.school || { province: "", ville: "", commune: "", nom: "", code: "" },
          flattenedSubjects,
          gradesMapping,
          totals: data.totals || {
            sum1erP: 0,
            sum2emeP: 0,
            sumExam1: 0,
            sumTotal1: 0,
            sum3emeP: 0,
            sum4emeP: 0,
            sumExam2: 0,
            sumTotal2: 0,
            sumGeneral: 0,
          },
          maxTotals: data.maxTotals || {
            sumMax1erP: 0,
            sumMax2emeP: 0,
            sumMaxExam1: 0,
            sumMaxTotal1: 0,
            sumMax3emeP: 0,
            sumMax4emeP: 0,
            sumMaxExam2: 0,
            sumMaxTotal2: 0,
            totalMaxGeneralDisplayed: 0,
          },
          percentages: data.percentages || {
            percent1erP: "0",
            percent2emeP: "0",
            percentExam1: "0",
            percentTotal1: "0",
            percent3emeP: "0",
            percent4emeP: "0",
            percentExam2: "0",
            percentTotal2: "0",
            percentGeneral: "0",
          },
          timestamp: data.timestamp || new Date(),
        };

        setBulletin(bulletinData);
      } else {
        setError("Code invalide - Bulletin non reconnu");
      }
    } catch (err) {
      console.error("Erreur lors de la récupération du bulletin :", err);
      setError("Erreur lors de la récupération du bulletin");
    }
  };

  useEffect(() => {
    if (bulletinIdFromQuery) {
      setCode(bulletinIdFromQuery);
      fetchBulletin(bulletinIdFromQuery);
    }
  }, [bulletinIdFromQuery]);

  useEffect(() => {
    if (code.length === 0) setError("");
  }, [code]);

  // Si vous simulez également un scan, vous pouvez déclencher la vérification
  const simulateScan = async () => {
    setIsScanning(true);
    setTimeout(async () => {
      const scannedCode = "KIN2023-456"; // Code simulé à partir du QR code
      setCode(scannedCode);
      await fetchBulletin(scannedCode);
      setIsScanning(false);
    }, 1500);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchBulletin(code);
  };


  return (
    <div className="min-h-[70vh] bg-gradient-to-br mt-16 md:mt-20 from-blue-50 to-yellow-50 
                    flex items-start justify-center px-4 md:px-8 pt-4 md:pt-8 overflow-x-hidden">
      <div className="w-full max-w-7xl bg-white rounded-2xl shadow-xl">
        {/* Header responsive */}
        <header className="px-4 py-4 md:px-8 md:py-6 bg-blue-600 rounded-t-2xl">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="bg-white p-2 rounded-lg">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Flag_of_the_Democratic_Republic_of_the_Congo.svg/1200px-Flag_of_the_Democratic_Republic_of_the_Congo.svg.png"
                alt="Drapeau RDC"
                className="h-10 w-14 md:h-12 md:w-16 object-cover"
              />
            </div>
            <div className="text-white text-center md:text-left">
              <h1 className="text-xl md:text-2xl font-bold">
                SYSTÈME NATIONAL DE VÉRIFICATION DES BULLETINS
              </h1>
              <p className="text-xs md:text-sm">
                Ministère de l'Enseignement Primaire, Secondaire et Technique
              </p>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <form onSubmit={handleFormSubmit} className="mb-6 md:mb-8">
            <div className="bg-blue-50 p-4 md:p-6 rounded-xl">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <div className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-blue-500">
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Entrez le BulletinId"
                    className="w-full px-4 md:px-6 py-3 md:py-4 pl-10 md:pl-12 text-base md:text-lg 
                               border-2 border-blue-200/50 hover:border-blue-300 focus:border-blue-500 
                               rounded-xl focus:ring-4 focus:ring-blue-100/50 placeholder:text-blue-400/70 
                               transition-all duration-200 bg-white/90 shadow-sm hover:shadow-md focus:shadow-lg"
                    autoComplete="off"
                  />
                  <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 flex gap-2">
                    {code && (
                      <button
                        type="button"
                        onClick={() => setCode("")}
                        className="p-1 md:p-1.5 text-blue-400 hover:text-blue-600 transition-colors"
                        aria-label="Effacer"
                      >
                        <svg
                          className="w-5 h-5 md:w-6 md:h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={simulateScan}
                      disabled={isScanning}
                      className={`p-2 md:p-2.5 rounded-lg ${
                        isScanning
                          ? "text-blue-400 cursor-wait"
                          : "text-blue-600 hover:bg-blue-50"
                      } transition-colors`}
                    >
                      {isScanning ? (
                        <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <QrCodeIcon className="w-5 h-5 md:w-6 md:h-6" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-4 py-3 md:px-8 md:py-4 bg-gradient-to-r from-green-500 to-blue-600 
                             hover:from-green-600 hover:to-blue-700 text-white font-semibold rounded-xl 
                             transition-all transform hover:scale-[1.02] flex items-center justify-center 
                             gap-2 md:gap-3 shadow-lg hover:shadow-xl"
                >
                  <CheckIcon className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="hidden md:inline">Vérifier</span>
                </button>
              </div>
              {error && (
                <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg 
                               flex items-center gap-3 animate-fade-in">
                  <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm md:text-base">Erreur de vérification</p>
                    <p className="text-xs md:text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </form>
          {bulletin && (
                      <>
                        {/* Version mobile : affichée pour les écrans en dessous de 640px */}
                        <div className="block sm:hidden overflow-hidden" style={{ width: "360px",  height: "500px" }}>
                          <div
                            className="transform origin-top-left"
                            style={{ width: "1200px", transform: "scale(0.30)" }}
                          >
                            <BulletinDisplay bulletin={bulletin} />
                          </div>
                        </div>
                        {/* Version desktop : affichée à partir de 640px */}
                        <div className="hidden sm:block">
                          <BulletinDisplay bulletin={bulletin} />
                        </div>
                      </>
                    )}



          <div className="mt-6 md:mt-8 text-center text-xs md:text-sm text-gray-600">
            <p>
              Système officiel de vérification - Toute falsification est passible de
              poursuites judiciaires
            </p>
            <p className="mt-2">
              © Ministère de l'EPST - RDC {new Date().getFullYear()}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
