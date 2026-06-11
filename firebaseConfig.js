// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBt_kuIE0bmd-PhcT5WGMeO8v0FqbuX2Ik",
  authDomain: "chatapp-team12-ede47.firebaseapp.com",
  projectId: "chatapp-team12-ede47",
  storageBucket: "chatapp-team12-ede47.firebasestorage.app",
  messagingSenderId: "1037252753564",
  appId: "1:1037252753564:web:215c818dc49762a8175559",
  measurementId: "G-E8T00020EF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);