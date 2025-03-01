"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { url } from "inspector";

const Footer = () => {
  return (
    <footer className="bg-[#0a0a0a] relative overflow-hidden px-10 border-t border-[#ffffff08]">
      {/* Effets de fond néon */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute w-[800px] h-[800px] -top-64 -left-64 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-400/20 to-transparent rounded-full mix-blend-screen" />
        <div className="absolute w-[600px] h-[600px] -bottom-48 -right-48 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-400/20 to-transparent rounded-full mix-blend-screen" />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Grille principale */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-20">
          {/* Colonne Carte */}
          <div className="lg:col-span-2">
            <div className="h-96 rounded-2xl border border-[#ffffff10] bg-gradient-to-br from-[#121212] to-[#1a1a1a] backdrop-blur-lg overflow-hidden relative group">
              <Image
                src="/images/rdcCarte1.jpg"
                alt="Carte 3D de la RDC"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                quality={100}
                priority
              />
              
              {/* Légende interactive */}
              <div className="absolute bottom-4 left-4 right-4 bg-[#ffffff03] p-4 rounded-xl backdrop-blur-xl border border-[#ffffff08]">
                <h3 className="text-lg font-semibold mb-2 text-cyan-300">Zones Couvertes</h3>
                <div className="flex space-x-4">
                  {['Kinshasa', 'Lubumbashi', 'Kolwezi'].map((city) => (
                    <div key={city} className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-glow" />
                      <span className="text-sm text-gray-300">{city}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Colonne Liens */}
          <div className="space-y-8 ">
            <Image
              src="/images/logop.png"
              alt="Logo Modern"
              width={160}
              height={48}
              className="mb-6 bg-[#e5e5e55a] rounded-xl shadow-lg"
            />
            
            <nav className="grid gap-4">
              {[
                ['Accueil', '/'],
                ['À propos', '/pages/a-propos'],
                ['Contact', '/pages/contact'],
                ['FAQ', '/pages/faq'],
              ].map(([title, href]) => (
                <Link
                  key={title}
                  href={href}
                  className="flex items-center space-x-3 text-gray-400 hover:text-cyan-300 transition-colors group"
                >
                  <div className="w-2 h-2 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-glow" />
                  <span>{title}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Colonne Newsletter */}
          <div className="space-y-8">
            <h3 className="text-xl font-semibold text-gray-200">Restez connecté</h3>
            
            <form className="space-y-4">
              <input
                type="email"
                placeholder="Votre email"
                className="w-full px-4 py-3 rounded-lg bg-[#ffffff] border border-[#ffffff10] focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10 transition-all placeholder-gray-500"
              />
              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-black px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-glow"
              >
                <span>S'inscrire</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </form>

            {/* Badges Sécurité */}
            <div className="pt-6 border-t border-[#ffffff08]">
              <div className="flex space-x-4">
                <Image
                  src="/images/ssl-certificate.png"
                  alt="SSL Sécurisé"
                  width={80}
                  height={80}
                  className="h-12 w-auto opacity-80  hover:opacity-100 transition-opacity"
                />
                <Image
                  src="/images/certification.png"
                  alt="RGPD Compatible"
                  width={80}
                  height={80}
                  className="h-12 w-auto opacity-80 hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Infos */}
        <div className="border-t border-[#ffffff08] pt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-72">
            {/* Partenaires */}
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-4">Partenaires Officiels</h4>
              <div className="flex flex-wrap gap-4">
                {['alogo', 'green_logo', 'obus'].map((partner) => (
                  <Image
                    key={partner}
                    src={`/images/${partner}.png`}
                    alt={`Logo ${partner}`}
                    width={80}
                    height={40}
                    className="h-10 w-auto opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                  />
                ))}
              </div>
            </div>

            {/* Réseaux Sociaux */}
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-4">Suivez-nous</h4>
              <div className="flex space-x-4">
                {[{
                  name: 'Facebook',
                  url: 'https://www.facebook.com/',
                  icon: 'facebook',
                },{
                  name: 'Instagram',
                  url: 'https://www.instagram.com/',
                  icon: 'instagram',
                },{
                  name: 'x',
                  url: 'https://www.x.com/',
                  icon: 'x',
                },{
                  name: 'LinkedIn',
                  url: 'https://www.linkedin.com/',
                  icon: 'linkedin',
                },].map((network) => (
                  <a
                    key={network.name}
                    href={network.url}
                    className="p-2 rounded-full bg-[#e5e5e55a] hover:bg-[#ffffff12] transition-colors"
                  >
                    <Image
                      src={`/social/${network.icon}.svg`}
                      alt={network.name}
                      width={24}
                      height={24}
                      className="w-7 h-7  opacity-80 hover:opacity-100"
                    />
                  </a>
                ))}
              </div>
            </div>
            </div>
           
        {/* Copyright */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            © {new Date().getFullYear()} Masomo RDC. Tous droits réservés.
            <br />
            <span className="text-cyan-300/80">Innovation au service de l'éducation</span>
          </p>
        
      </div>
      </div></div>
    </footer>
  );
};

export default Footer;