import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";
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
    redirectToMain
})
homeField.appendChild(homeLink);
TopNav.appendChild(homeField);

const moneyAmountField = document.querySelector("#moneyAmountField");
const usernameField = document.querySelector("#usernameField");
const logoutField = document.querySelector('#logoutField');


// ****** Game access

// **** Create game  

// create random game key between the number 1111 and 9999
const getGameKey = () => {
    return Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;
};
onAuthStateChanged(auth, (user) => {
    if (user) {
        // button to add money
        const addMoneyField = document.createElement("div");
        addMoneyField.setAttribute("id", "addMoneyField");
        addMoneyField.innerHTML = `+`;
        TopNav.appendChild(addMoneyField);
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        const uid = user.uid;
        // username field
        const displayName = user.displayName;
        usernameField.innerHTML = displayName;
        // money field
        // realtime listener - onValue - Updates how much money the user has
        onValue(ref(db, `users/` + uid), (snapshot) => {
            const money = snapshot.val().money;
            // field for amount of money the user has
            moneyAmountField.innerHTML = `${money} DKK`;
        });

        // signout button
        logoutField.addEventListener('click', (e) => {
            signOut(auth).then(() => {
                // Sign-out successful.
                console.log("User signed out");
              }).catch((error) => {
                // An error happened.
                console.log(error.message);
              });
        })

        // **** Create game 
        // The create button 
        const createbutton = document.querySelector("#CreateGameButton");
        createbutton.addEventListener('click', (e) => {
            const gameKey = getGameKey();
            // Inistialize game in database
            set(ref(db, 'games/' + gameKey), {
                isSpinning: false,
                winnerHasBeenFound: true,
                gameAngles: {0: 0},
                lastAngle: 0,
                key: gameKey,
                prizepool: 0
            });
            console.log(gameKey);
            // make the user join this game in database
            set(ref(db, 'games/' + gameKey + '/players/' + uid), {
                displayName: displayName,
                bet: 0, 
                color: generateRandomColor(),
                uid: uid
            });
            // redirect user to join the game after 2 second delay
            setTimeout(() => {
                redirectTo(gameKey);
            }, 2000);  // delay is specified in milliseconds

        });

        // **** Join game 
        // join a game using a specifc game key
        const joinButton = document.querySelector("#JoinGameButton");
        joinButton.addEventListener('click', (e) => {
            let gameID = prompt("Please enter your game id");
            if (gameID != null) {
                // make the user join this game in database
                set(ref(db, 'games/' + gameID + '/players/' + uid), {
                    displayName: displayName,
                    bet: 0,
                    color: generateRandomColor(),
                    uid: uid
                });
                // redirect user to join the game after 2 second delay
                setTimeout(() => {
                    redirectTo(gameID);
                }, 2000);  // delay is specified in milliseconds
            }
        });

        // ...
    } else {
        const loginLink = document.createElement("div");
        const errorArea = document.querySelector("#errorArea");
        loginLink.addEventListener('click', (e) => {
            redirectToLogin();
        })
        usernameField.style.display = "none";
        moneyAmountField.style.display = "none";
        loginLink.setAttribute("id", "loginLink");
        loginLink.innerHTML = `login`;
        TopNav.appendChild(loginLink);
        const joinButton = document.querySelector("#JoinGameButton");
        joinButton.addEventListener('click', (e) => {
            errorArea.innerHTML = "Please login before joining game";
        });

        // If pressing createButton
        const createbutton = document.querySelector("#CreateGameButton");
        createbutton.addEventListener('click', (e) => {
            errorArea.innerHTML = "Please login before creating game";
            // make login light up
        });
        console.log("User is signed out");
        // ...
    }
});


function redirectTo(gameKey) {
    const currentURL = window.location.href.split('/')[0];
    window.location.href = currentURL + '/game' + '#' + gameKey;
}

function redirectToLogin() {
    const currentURL = window.location.href.split('/')[0];
    window.location.href = currentURL + '/login';
}

function redirectToMain() {
    const currentURL = window.location.href.split('/')[0];
    window.location.href = currentURL + '/main';
}

// Generates a random color  
function generateRandomColor() {
	// Generate random values for the red, green, and blue channels
	const r = Math.floor(Math.random() * 80);
	const g = Math.floor(Math.random() * 80);
	const b = Math.floor(Math.random() * 80);

	// Return the random color as a string in the RGB format
	return `rgb(${r}, ${g}, ${b})`;
}



// set er en asynchronus operation derfor kan man skrive then bagefter for at få den til at udføre noget efter den har skrevet til databasen
// set.then(() => {
//  console.log('User information successfully written to database');
//});


