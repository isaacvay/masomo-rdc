// firebaseSecondary.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "./firebase"; // Assurez-vous que le chemin est correct

// Initialiser l'application secondaire avec un nom unique
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

export { secondaryAuth };
