// This should look just like the login page but just with a signup setup instead of login
// How to manage users - https://firebase.google.com/docs/auth/web/manage-users

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously, updateProfile } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

// My app's Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyCER4V0fDrCr81hRGBoz99b-J5ShZC9rfE",

    authDomain: "wheel-be259.firebaseapp.com",

    databaseURL: "https://wheel-be259-default-rtdb.europe-west1.firebasedatabase.app",

    projectId: "wheel-be259",

    storageBucket: "wheel-be259.appspot.com",

    messagingSenderId: "66686151",

    appId: "1:66686151:web:8f7e94bff4ebbcbccf02e2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Realtime Database and get a reference to the service
const db = getDatabase(app);

// ************** TopNav
const TopNav = document.querySelector("#topnav");
// home menu
const homeField = document.createElement("div");
const homeLink = document.createElement("a");
homeField.setAttribute("id", "homeField");
homeLink.setAttribute("id", "homeLink");
homeLink.innerHTML = `home`;
homeField.addEventListener('click', (e) => {
    redirectTo();
})
homeField.appendChild(homeLink);
TopNav.appendChild(homeField);

const errorArea = document.querySelector("#errorArea");

// Create new user 
const signupForm = document.getElementById('login-form');
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newEmail = document.getElementById('email').value;
    const newPassword = document.getElementById('password').value;
    const displayName = newEmail.split('@')[0];

    createUserWithEmailAndPassword(auth, newEmail, newPassword)
        .then((userCredential) => {
            // User successfully created
            console.log('Successfully created user with email and password');
            const user = userCredential.user;
            // stores the user in the database
            storeInDataBase(user);
            // gives a displayName
            updateProfile(auth.currentUser, {
                displayName: displayName
            }).then(() => {
                // Profile updated!
                // ...
            }).catch((error) => {
                // An error occurred
                console.log(error.message);
                errorArea.innerHTML = error.message;
                // ...
            });
        })
        .catch((error) => {
            if (error.code === 'auth/email-already-in-use') {
                // Email address is already in use
                console.error('Email address is already in use');
            } else {
                // Some other error occurred
                console.log(error.message);
                errorArea.innerHTML = error.message;
            }
        });
});

function storeInDataBase(user) {
    const email = user.email;
    const displayName = user.displayName;
    const photoURL = "none";
    const uid = user.uid;
    const money = 0;


    // stores the user in the database
    set(ref(db, 'users/' + uid), {
        displayName: displayName,
        userID: uid,
        email: email,
        photoURL: photoURL,
        money: money
    });
    // redirect user to main menu after 2 second delay
    setTimeout(() => {
        redirectTo();
    }, 2000);  // delay is specified in milliseconds
}

function redirectTo() {
    const currentURL = window.location.href.split('/')[0];
    window.location.href = currentURL + '/';
}
