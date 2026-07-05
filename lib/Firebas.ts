import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB9DoIFJE5reNHn8SN9w_d9T5PGdwvlctM",
  authDomain: "aditya-general-store-b9410.firebaseapp.com",
  projectId: "aditya-general-store-b9410",
  storageBucket: "aditya-general-store-b9410.appspot.com",
  messagingSenderId: "287350635798",
  appId: "1:287350635798:web:b46e8cfd91bd3f2392a437",
  measurementId: "G-3D7B0TNCGZ"
};

// Next.js/Serverless एनवायरनमेंट के लिए ऐप को इस तरह इनिशियलाइज़ करते हैं
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
