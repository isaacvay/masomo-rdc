// utils.ts

/**
 * Convertit une date en chaîne ISO complète.
 */
export const convertDateToISO = (date: string, time: string = ''): string => {
  // Si une heure est renseignée, on la combine à la date
  if (time) {
    return new Date(`${date}T${time}`).toISOString();
  }
  // Sinon, on retourne la date en ISO en ajoutant minuit
  return new Date(date).toISOString();
};

/**
 * Convertit et formate une date à partir de date et heure.
 */
export const convertAndFormatDate = (date: string, time: string = ''): string => {
  // Vous pouvez adapter ce format selon vos besoins
  return convertDateToISO(date, time);
};

/**
 * Extrait la partie date (format 'YYYY-MM-DD') à partir d'une date (chaîne, Date ou Timestamp).
 */
export const extractDatePart = (dateInput: any): string => {
  if (!dateInput) {
    return '';
  }
  try {
    let dateObj: Date;
    // Si l'entrée est un objet Date ou peut être converti en Date
    if (dateInput instanceof Date) {
      dateObj = dateInput;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
      dateObj = new Date(dateInput);
    } else if (dateInput.toDate) {
      // Par exemple, pour un Timestamp Firestore
      dateObj = dateInput.toDate();
    } else {
      throw new Error('Type de date non supporté');
    }
    if (isNaN(dateObj.getTime())) {
      throw new Error('Date invalide');
    }
    // Retourne la partie date formatée en ISO (YYYY-MM-DD)
    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    console.error("Erreur dans extractDatePart :", error);
    return '';
  }
};

/**
 * Extrait la partie heure (format 'HH:MM') à partir d'une date (chaîne, Date ou Timestamp).
 */
export const extractTimePart = (dateInput: any): string => {
  if (!dateInput) {
    return '';
  }
  try {
    let dateObj: Date;
    if (dateInput instanceof Date) {
      dateObj = dateInput;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
      dateObj = new Date(dateInput);
    } else if (dateInput.toDate) {
      dateObj = dateInput.toDate();
    } else {
      throw new Error('Type de date non supporté');
    }
    if (isNaN(dateObj.getTime())) {
      throw new Error('Date invalide');
    }
    // Retourne l'heure au format HH:MM (en se basant sur l'heure locale)
    return dateObj.toTimeString().slice(0, 5);
  } catch (error) {
    console.error("Erreur dans extractTimePart :", error);
    return '';
  }
};
