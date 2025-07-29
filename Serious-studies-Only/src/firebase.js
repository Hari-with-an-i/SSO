
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAppdY_vre_Up32vlXaUAzs4-9X2dF0Ftc",
    authDomain: "serious-studies-only.firebaseapp.com",
    projectId: "serious-studies-only",
    storageBucket: "serious-studies-only.appspot.com",
    messagingSenderId: "445345031564",
    appId: "1:445345031564:web:2616ac4c9ee5210d44e2a9",
    measurementId: "G-Z1EHN5Z7MS"
};

firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const db = firebase.firestore();
