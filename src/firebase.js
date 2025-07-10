// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAnuT5ukLvRqnMCWoDv-kQU9JY5dPt9Zcg",
  authDomain: "apptesorariadbvnetlify.firebaseapp.com",
  projectId: "apptesorariadbvnetlify",
  storageBucket: "apptesorariadbvnetlify.firebasestorage.app",
  messagingSenderId: "75237391664",
  appId: "1:75237391664:web:19b0f1e9b0f09410ffdcf5",
  measurementId: "G-WNBJRDMT88",
  databaseURL: "https://apptesorariadbvnetlify-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);