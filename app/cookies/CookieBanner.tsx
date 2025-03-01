"use client"
import React, { useEffect, useState } from 'react';
import { setCookie, getCookie } from '@/utils/cookies';

const BannièreCookies: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (!getCookie('cookieConsent')) {
      setIsMounted(true);
      setTimeout(() => setIsVisible(true), 100);
    }
  }, []);

  const handleResponse = (response: string) => {
    setCookie('cookieConsent', response, 365);
    setIsVisible(false);
    setTimeout(() => setIsMounted(false), 300);
  };

  if (!isMounted) return null;

  return (
    <div className={`fixed bottom-0 left-0 w-full bg-gray-800 text-white transition-transform duration-300 ease-out z-50 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-semibold mb-2 flex items-center justify-center md:justify-start">
              🍪 Préférences de cookies
            </h3>
            <p className="text-sm opacity-90">
              Nous utilisons des cookies pour améliorer votre expérience. En cliquant sur "Tout accepter", vous acceptez notre{' '}
              <a 
                href="/pages/privacy-policy" 
                className="underline hover:opacity-80 ml-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                Politique de confidentialité
              </a>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleResponse('declined')}
              className="px-6 py-2 text-sm font-medium bg-transparent border border-white rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Refuser les cookies"
            >
              Tout refuser
            </button>
            <button
              onClick={() => handleResponse('accepted')}
              className="px-6 py-2 text-sm font-medium bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              aria-label="Accepter les cookies"
            >
              Tout accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannièreCookies;
