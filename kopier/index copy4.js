
// ***************** Firebase **************
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get, update } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

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

let uid;
let displayName;

// The way to get the current signed in user.
// If the user is signed in then we can get different attributes
onAuthStateChanged(auth, (user) => {
	if (user) {
		// User is signed in, see docs for a list of available properties
		// https://firebase.google.com/docs/reference/js/firebase.User
		uid = user.uid;
		console.log(uid);
		// username field
		displayName = user.displayName;
		const usernameField = document.querySelector("#usernameField");
		usernameField.innerHTML = displayName;
		// money field
		// realtime listener - onValue - Updates how much money the user has
		onValue(ref(db, `users/` + uid), (snapshot) => {
			const money = snapshot.val().money;
			// field for amount of money the user has
			const moneyAmountField = document.querySelector("#moneyAmountField");
			moneyAmountField.innerHTML = money;
		});

		// add the ability to make a bet

		// ...
	} else {
		console.log("User is signed out");
		// ...
	}
});

// https://stackoverflow.com/questions/33850201/how-to-draw-a-wheel-of-fortune

// For when the user wins - It should maybe be coins instead
// https://www.cssscript.com/confetti-falling-animation/

// ***************** Wheel ******************

// Fill the wheel 
function generateRandomColor(label) {
	if (label === displayName) {
		return "rgb(66, 197, 48)";
	}
	// Generate random values for the red, green, and blue channels
	const r = Math.floor(Math.random() * 80);
	const g = Math.floor(Math.random() * 80);
	const b = Math.floor(Math.random() * 80);

	// Return the random color as a string in the RGB format
	return `rgb(${r}, ${g}, ${b})`;
}
const gameID = window.location.href.split("#")[1];
// realtime listener for the wheel - Updates all the bets
//let sectors = [];

/*
let sectors = [
	{ color: "#f82", label: "Stack", bet: 20 },
	{ color: "#0bf", label: "10", bet: 30 },
	{ color: "#fb0", label: "200", bet: 10 },
	{ color: "#0fb", label: "50", bet: 50 },
	{ color: "#b0f", label: "100", bet: 20 },
	{ color: "#f0b", label: "5", bet: 100 },
	{ color: "#bf0", label: "500", bet: 10 },
];
*/

let sectors;
console.log(sectors);
if (sectors === undefined) {
	sectors = [];
}

let host;
// updates the sectors on the wheel
onValue(ref(db, `games/` + gameID + "/players"), (snapshot) => {
	let replacementSectors = [];
	snapshot.forEach(function (childSnapshot) {
		let bet = childSnapshot.val().bet;
		let label = childSnapshot.val().displayName;
		let color = generateRandomColor(label);
		let sector = { color: color, label: label, bet: bet };
		replacementSectors.push(sector);
		console.log("Ændring");
	})
	sectors = replacementSectors;
	getPrizePool();
	console.log("Prizepool is: " + prizePool);
	sectors.forEach(drawSector);
	//const prizePoolField = document.querySelector("#prizepoolField");
	const elSpin = document.querySelector("#spin");
	//prizePoolField.innerHTML = `${prizePool} DKK `;
	elSpin.innerHTML = `${prizePool} DKK `;
	console.log(sectors);
	host = sectors[0].label;
	console.log("Host is" + host);
});

let isSpinning;
let angVel;
let isAccelerating;
// checks if the wheel is currently spinning
onValue(ref(db, `games/` + gameID), (snapshot) => {
	isSpinning = snapshot.val().isSpinning;
	angVel = snapshot.val().angVel;    // Current angular velocity
	isAccelerating = snapshot.val().isAccelerating;
});

// Generate random float in range min-max:
const rand = (m, M) => Math.random() * (M - m) + m;

const tot = sectors.length;
const elSpin = document.querySelector("#spin");
const ctx = document.querySelector('#wheel').getContext`2d`;
const dia = ctx.canvas.width;
const rad = dia / 2;
const PI = Math.PI;
const TAU = 2 * PI; // the full circle - radians
const friction = 0.997;  // 0.995=soft, 0.99=mid, 0.98=hard - Deacelerate
const angVelMin = 0.0007; // Below that number will be treated as a stop
let angVelMax = 0; // Random ang.vel. to acceletare to - it determines winner 
let ang = 0;       // Angle rotation in radians

let radiansSum = 0; // Sum of current anglerotation
let sectorsPositions = []; // keeps track of all sectors winning positions

let prizePool = 0;
getPrizePool();

console.log(sectorsPositions);

// calculates the total prizepool of all users in the game. 
function getPrizePool() {
	prizePool = 0;
	sectors.forEach(calculatePrizePool)
}
function calculatePrizePool(section) {
	prizePool += section.bet;
}

//* Gets the current sector which the pointer is on */
//const getIndex = () => Math.floor(tot - ang / TAU * tot) % tot;


// How the credits work
// The prizepool will be given in game-credits. If the user wants to withdraw the credits, the user should press "withdraw"
// The prizepool credits will be given to the user after the game has ended. 
// If the user leaves the game we should check if user was the winner. If true, the credits should be given after a few seconds.    

// determenes the winner
function determineWinner(ang) {
	for (const sector of sectorsPositions) {
		const [label, start, end] = sector;
		if (ang >= start && ang < end) {
			return sector;
		}
	}
	return "no winner found";
}
/*
const getWinner = (startAngle) => {
	// Finds how many times startAngle*1.06 is run until reaching maxVel
	let timesTillMax = angVelMax/(startAngle+angVelMin)*1.06;
	let timesTillZero = angVelMin/angVelMax*friction;

	let currentAng;
	for(let i = 0; i <= timesTillMax; i++) {
		startAngle *= 1.06;
		currentAng += startAngle;
		currentAng %= TAU;
	}
	for(let i = 0; i <= timesTillZero; i++) {
		startAngle *= 0.997;
		currentAng += startAngle;
		currentAng %= TAU;
	}
	console.log(determineWinner(TAU - currentAng)[0]);
	//return determineWinner(TAU - currentAng)[0];
}
/*



//* Draw sectors and prizes texts to canvas on load */
const drawSector = (sector, i) => {
	const percentage = sector.bet / prizePool; // the chance of winning
	console.log(sector.label + " has a " + percentage + " chance of winning");
	const degrees = percentage * 360.0;
	const radians = degrees * (Math.PI / 180);
	radiansSum += radians;
	const arc = TAU / sectors.length;
	// saves angle for the sectors winning position
	const winningPosition = [sector.label, radiansSum - radians, radiansSum, sector.color];
	sectorsPositions.push(winningPosition);
	ctx.save();
	// ***** COLOR
	ctx.beginPath();
	ctx.fillStyle = sector.color;
	ctx.moveTo(rad, rad);
	// radiansSum - radians is the start of the sector. radiansSum is the end. 
	ctx.arc(rad, rad, rad, radiansSum - radians, radiansSum);
	ctx.lineTo(rad, rad);
	ctx.fill();
	// ***** TEXT
	ctx.translate(rad, rad);
	// Places the text in the middle of the sector
	ctx.rotate(((radiansSum - radians) + radiansSum) / 2);
	ctx.textAlign = "right";
	ctx.fillStyle = "#fff";
	ctx.font = "bold 20px sans-serif";
	ctx.fillText(sector.label, rad - 10, 10);

	ctx.restore();
};
let text = "";


//* CSS rotate CANVAS Element */
const rotate = () => {
	const currentSectorColor = determineWinner(TAU - ang)[3];
	ctx.canvas.style.transform = `rotate(${ang - PI / 2}rad)`;
	elSpin.textContent = !angVel ? `${prizePool} DKK` : `${prizePool} DKK`;
	elSpin.style.background = "#333";
};

let interValID;
// These 3 methods make the angVel update to the database
function updateAngVelEngine() {
	console.log("updateAngVelEngine");
	if (!interValID) {
		setInterval(updateAngVel, 5);
	}
}

function stopAngVelEngine() {
	clearInterval(interValID);
	interValID = null;
}

function updateAngVel() {
	update(ref(db, 'games/' + gameID), {
		angVel: angVel
	})
		.then(() => {
			console.log(`angVel update succesful. Set ${angVel}`);
		})
		.catch((error) => {
			console.log("angVel update failed");
		});
}

const frame = () => {

	if (!isSpinning) return;

	if (angVel >= angVelMax) {
		update(ref(db, 'games/' + gameID), {
			isAccelerating: false
		})
			.then(() => {
				console.log("isAccelerating update succesful. Set false");
			})
			.catch((error) => {
				console.log("isAccelerating update failed");
			});
	}
	// Accelerate
	if (isAccelerating) {
		angVel ||= angVelMin; // Initial velocity kick
		angVel *= 1.06; // Accelerate
	}

	// Decelerate
	else {
		update(ref(db, 'games/' + gameID), {
			isAccelerating: false
		})
			.then(() => {
				console.log("isAccelerating update succesful. Set true");
			})
			.catch((error) => {
				console.log("isAccelerating update failed");
			});
		angVel *= friction; // Decelerate by friction

		// SPIN END: Wheel is standing still
		if (angVel < angVelMin) {
			console.log("spin has ended");
			console.log("angvel is: " + angVel + " and angVelMin is: " + angVelMin);
			console.log("isAccelerating is set to: " + isAccelerating);
			console.log("ang is: " + ang);
			// Updates the new total betted amount 
			update(ref(db, 'games/' + gameID), {
				isSpinning: false
			})
				.then(() => {
					console.log("isSpinning update succesful. Set false");
				})
				.catch((error) => {
					console.log("isSpinning update failed");
				});
			// TAU - ang because then TAU is the full circle and then subtract the current ang it is on
			const winner = determineWinner(TAU - ang)[0];
			if (winner) {
				console.log(`The winner is ${winner}`);
			} else {
				console.log("No winner was determined.");
			}
			angVel = 0;
			update(ref(db, 'games/' + gameID), {
				angVel: angVel
			})
				.then(() => {
					console.log(`angVel update succesful. Set to ${angVel}`);
				})
				.catch((error) => {
					console.log("isSpinning update failed");
				});
			stopAngVelEngine;
			startConfetti();
		}
	}

	ang += angVel; // Update angle
	ang %= TAU;    // Normalize angle
	rotate();      // CSS rotate!
};

const engine = () => {
	frame();
	requestAnimationFrame(engine);
};

// When clicking on spin button
elSpin.addEventListener("click", () => {
	if (isSpinning) return;
	//getWinner(ang);
	// updates the current angVel to the database every x ms
	updateAngVelEngine();
	// Sets the spinning to true
	update(ref(db, 'games/' + gameID), {
		isSpinning: true
	})
		.then(() => {
			console.log("isSpinning update succesful. Set true");
		})
		.catch((error) => {
			console.log("isSpinning update failed");
		});
	update(ref(db, 'games/' + gameID), {
		isAccelerating: true
	})
		.then(() => {
			console.log("isAccelerating update succesful. Set true");
		})
		.catch((error) => {
			console.log("isAccelerating update failed");
		});
	angVelMax = rand(0.25, 0.40);
	stopConfetti();
	console.log("angvelMax is: " + angVelMax);
	console.log("ang is: " + ang);
});

// Instead of click game should start when people are ready
const startGame = () => {
	// if at least two people have made a bet
	   // if it has been 10 sec since at least two people made the bet
	      // start the game
		  // set database to spinning = true
}


// INIT
sectors.forEach(drawSector);
rotate(); // Initial rotation
engine(); // Start engine!




// ************** TopNav
const TopNav = document.querySelector("#topnav");
// button to add money
const addMoneyField = document.createElement("div");
addMoneyField.setAttribute("id", "addMoneyField");
addMoneyField.innerHTML = `+`;
TopNav.appendChild(addMoneyField);
// home menu
const homeField = document.createElement("div");
const homeLink = document.createElement("a");
homeField.setAttribute("id", "homeField");
homeLink.setAttribute("id", "homeLink");
homeLink.innerHTML = `home`;
homeField.href = "main.html";
homeField.appendChild(homeLink);
TopNav.appendChild(homeField);


// ************** Make a bet area
const makeBetArea = document.querySelector("#makeBetArea");
const makeBetField = document.createElement("input");
const makeBetButton = document.createElement("button");
makeBetField.setAttribute("id", "makeBetField");
makeBetButton.setAttribute("id", "makeBetButton");
makeBetButton.innerHTML = "BET"
makeBetArea.appendChild(makeBetField);
makeBetArea.appendChild(makeBetButton);
makeBetButton.addEventListener('click', (e) => {
	const betValue = document.querySelector("#makeBetField").value;
	// remove spaces in front and end
	const bet = betValue.trim();
	console.log(bet);
	if (bet === '') {
		console.log("input is empty");
	}
	// checks if input is a number
	if (!isNaN(bet)) {
		console.log("This was a number");
		let currentMoney;
		let currentBet;
		// retrieves amount of money the user has
		onValue(ref(db, 'users/' + uid), (snapshot) => {
			currentMoney = snapshot.val().money;
			console.log(currentMoney);
		}, {
			onlyOnce: true
		});
		// retrives the amount which the user currently has betted
		onValue(ref(db, 'games/' + gameID + '/players/' + uid), (snapshot) => {
			currentBet = snapshot.val().bet;
			console.log(currentBet);
		}, {
			onlyOnce: true
		});

		// calculate the amount of money the user has and the total betted amount now
		const newMoney = currentMoney - bet;
		// + in front of makes it to an int
		const totalBet = +currentBet + +bet;

		console.log("newMoney" + newMoney);
		console.log("totalBet" + totalBet);

		if (newMoney >= 0) {
			// updates the amount of money the user now have
			update(ref(db, 'users/' + uid), {
				money: newMoney
			})
				.then(() => {
					console.log("Money subtracted");
					console.log("uid is:" + uid);
				})
				.catch((error) => {
					console.log("The write failed");
				});
			// Updates the new total betted amount 
			update(ref(db, 'games/' + gameID + '/players/' + uid), {
				bet: totalBet
			})
				.then(() => {
					console.log("Money subtracted");
				})
				.catch((error) => {
					console.log("The write failed");
				});

		} else {
			console.log("Not enough money to make the bet");
		}




	} else {
		console.log("This was not a number");
	};
	// clears the input field
	document.querySelector("#makeBetField").value = "";
});
// ************** Chance of winning area
const changeOfWinningArea = document.querySelector("#chanceOfWinningArea");
const chanceOfWinningField = document.createElement("div");
chanceOfWinningField.setAttribute("id", "chanceOfWinningField");
chanceOfWinningField.innerHTML = `x%`;
changeOfWinningArea.appendChild(chanceOfWinningField);

/*
// ************** PrizeFieldArea
const prizepoolArea = document.querySelector("#prizepoolArea");
const prizepoolField = document.createElement("div");
prizepoolField.setAttribute("id", "prizepoolField");
prizepoolField.innerHTML = `${prizePool} DKK `;
prizepoolArea.appendChild(prizepoolField);
*/








// ********************** Confetti *****************
var maxParticleCount = 100; //set max confetti count
var particleSpeed = 2; //set the particle animation speed
var startConfetti; //call to start confetti animation
var stopConfetti; //call to stop adding confetti
var toggleConfetti; //call to start or stop the confetti animation depending on whether it's already running
var removeConfetti; //call to stop the confetti animation and remove all confetti immediately

(function () {
	startConfetti = startConfettiInner;
	stopConfetti = stopConfettiInner;
	toggleConfetti = toggleConfettiInner;
	removeConfetti = removeConfettiInner;
	var colors = ["DodgerBlue", "OliveDrab", "Gold", "Pink", "SlateBlue", "LightBlue", "Violet", "PaleGreen", "SteelBlue", "SandyBrown", "Chocolate", "Crimson"]
	var streamingConfetti = false;
	var animationTimer = null;
	var particles = [];
	var waveAngle = 0;

	function resetParticle(particle, width, height) {
		particle.color = colors[(Math.random() * colors.length) | 0];
		particle.x = Math.random() * width;
		particle.y = Math.random() * height - height;
		particle.diameter = Math.random() * 10 + 5;
		particle.tilt = Math.random() * 10 - 10;
		particle.tiltAngleIncrement = Math.random() * 0.07 + 0.05;
		particle.tiltAngle = 0;
		return particle;
	}

	function startConfettiInner() {
		const width = window.innerWidth;
		const height = window.innerHeight;
		window.requestAnimFrame = (function () {
			return window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				window.oRequestAnimationFrame ||
				window.msRequestAnimationFrame ||
				function (callback) {
					return window.setTimeout(callback, 16.6666667);
				};
		})();
		let canvas = document.getElementById("confetti-canvas");
		if (canvas === null) {
			canvas = document.createElement("canvas");
			canvas.setAttribute("id", "confetti-canvas");
			document.body.appendChild(canvas);
			canvas.width = width;
			canvas.height = height;
			window.addEventListener("resize", function () {
				canvas.width = window.innerWidth;
				canvas.height = window.innerHeight;
			}, true);
		}
		const context = canvas.getContext("2d");
		while (particles.length < maxParticleCount)
			particles.push(resetParticle({}, width, height));
		streamingConfetti = true;
		if (animationTimer === null) {
			(function runAnimation() {
				context.clearRect(0, 0, window.innerWidth, window.innerHeight);
				if (particles.length === 0)
					animationTimer = null;
				else {
					updateParticles();
					drawParticles(context);
					animationTimer = requestAnimFrame(runAnimation);
				}
			})();
		}
	}

	function stopConfettiInner() {
		streamingConfetti = false;
	}

	function removeConfettiInner() {
		stopConfetti();
		particles = [];
	}

	function toggleConfettiInner() {
		if (streamingConfetti)
			stopConfettiInner();
		else
			startConfettiInner();
	}

	function drawParticles(context) {
		let particle;
		let x;
		for (let i = 0; i < particles.length; i++) {
			particle = particles[i];
			context.beginPath();
			context.lineWidth = particle.diameter;
			context.strokeStyle = particle.color;
			x = particle.x + particle.tilt;
			context.moveTo(x + particle.diameter / 2, particle.y);
			context.lineTo(x, particle.y + particle.tilt + particle.diameter / 2);
			context.stroke();
		}
	}

	function updateParticles() {
		const width = window.innerWidth;
		const height = window.innerHeight;
		let particle;
		waveAngle += 0.01;
		for (let i = 0; i < particles.length; i++) {
			particle = particles[i];
			if (!streamingConfetti && particle.y < -15)
				particle.y = height + 100;
			else {
				particle.tiltAngle += particle.tiltAngleIncrement;
				particle.x += Math.sin(waveAngle);
				particle.y += (Math.cos(waveAngle) + particle.diameter + particleSpeed) * 0.5;
				particle.tilt = Math.sin(particle.tiltAngle) * 15;
			}
			if (particle.x > width + 20 || particle.x < -20 || particle.y > height) {
				if (streamingConfetti && particles.length <= maxParticleCount)
					resetParticle(particle, width, height);
				else {
					particles.splice(i, 1);
					i--;
				}
			}
		}
	}
})();
