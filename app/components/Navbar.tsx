"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { auth } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="mx-auto w-[80%] px-4  flex justify-between items-center h-20 relative">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <img src="/images/logo.png" alt="Logo" className="w-10 h-10" />
          <h1 className="text-xl font-bold font-montserrat bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            MASOMO rdc
          </h1>
        </div>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-6 text-[#0D1B2A] font-medium">
          <li>
            <Link href="/" prefetch className="hover:text-[#e69f25] transition duration-300">
              Accueil
            </Link>
          </li>
          <li>
            <Link href="/pages/fonctionnalites" prefetch className="hover:text-[#e69f25] transition duration-300">
              Fonctionnalités
            </Link>
          </li>
          <li>
            <Link href="/pages/a-propos" prefetch className="hover:text-[#e69f25] transition duration-300">
              À propos
            </Link>
          </li>
          <li>
            <Link href="/pages/contact" prefetch className="hover:text-[#e69f25] transition duration-300">
              Contact
            </Link>
          </li>
        </ul>

        {/* Desktop Button */}
        {isLoggedIn ? (
          <button
            onClick={() => {
              window.location.href = "/dashboardPrin";
            }}
            className="hidden md:inline-block px-6 py-3 bg-[#e69f25] text-white font-semibold rounded-full shadow-md hover:shadow-lg transition duration-300 transform hover:scale-105"
          >
            Dashboard
          </button>
        ) : (
          <button
            onClick={() => {
              window.location.href = "/pages/connexion";
            }}
            className="hidden md:inline-block px-6 py-3 bg-[#e69f25] text-white font-semibold rounded-full shadow-md hover:shadow-lg transition duration-300 transform hover:scale-105"
          >
            Connexion
          </button>
        )}

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-[#0D1B2A] focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
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
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          )}
        </button>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg py-4">
            <ul className="flex flex-col items-center space-y-4 text-[#0D1B2A] font-medium">
              <li>
                <Link
                  href="/"
                  prefetch
                  className="hover:text-[#e69f25] transition duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  href="/pages/fonctionnalites"
                  prefetch
                  className="hover:text-[#e69f25] transition duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link
                  href="/pages/a-propos"
                  prefetch
                  className="hover:text-[#e69f25] transition duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  À propos
                </Link>
              </li>
              <li>
                <Link
                  href="/pages/contact"
                  prefetch
                  className="hover:text-[#e69f25] transition duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </Link>
              </li>
              <li className="mt-4">
                {isLoggedIn ? (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      window.location.href = "/dashboardPrin";
                    }}
                    className="px-6 py-3 bg-[#e69f25] text-white font-semibold rounded-full shadow-md hover:shadow-lg transition duration-300"
                  >
                    Dashboard
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      window.location.href = "/pages/connexion";
                    }}
                    className="px-6 py-3 bg-[#e69f25] text-white font-semibold rounded-full shadow-md hover:shadow-lg transition duration-300"
                  >
                    Connexion
                  </button>
                )}
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;