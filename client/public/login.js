import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously, signOut } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

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

// ************* The two buttons. Sign in using email and password or anonym

// Sign in using email and password
const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', (e) => {
  // preventDefault prevents submitting which is the default value
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      // User successfully signed in
      console.log('Successfully signed in with email and password');
      // then redirect
      redirectTo();
    })
    .catch((error) => {
      // An error occurred
      errorArea.innerHTML = error.message;
      console.error(error);
    });
});

// Sign out button
const signOutButton = document.querySelector("#signOutButton");
signOutButton.addEventListener('click', (e) => {
  signOut(auth).then(() => {
    console.log("Sign-out successful");
  }).catch((error) => {
    console.log("Could not sign out");
  });
})

// The way to get the current signed in user.
// If the user is signed in then we can get different attributes
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/firebase.User
    const uid = user.uid;
    console.log(uid)
    // ...
  } else {
    console.log("User is signed out");
    // ...
  }
});

// You can also get the user by 
const user = auth.currentUser;


function storeInDataBase() {
  const displayName = "anonym";
  const uid = user.uid;
  const money = 0;


  // stores the user in the database
  set(ref(db, 'anonymUsers/'), {
    displayName: displayName,
    userID: uid,
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





