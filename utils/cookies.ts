// utils/cookies.ts

// Définit un cookie avec un délai d'expiration en jours
export function setCookie(name: string, value: string, days?: number): void {
    if (days !== undefined && typeof days !== 'number') {
      throw new TypeError("Le paramètre 'days' doit être un nombre");
    }
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + encodeURIComponent(value || "") + expires + "; path=/; Secure; SameSite=Lax";
  }
  
  // Récupère la valeur d'un cookie
  export function getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
    }
    return null;
  }
  
  // Supprime un cookie
  export function eraseCookie(name: string): void {
    document.cookie = name + "=; Max-Age=-99999999; path=/; Secure; SameSite=Lax";
  }
  