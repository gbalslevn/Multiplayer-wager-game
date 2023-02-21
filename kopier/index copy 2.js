// This copy was made 21/12/2022

// https://stackoverflow.com/questions/33850201/how-to-draw-a-wheel-of-fortune

// For when the user wins - It should maybe be coins instead
// https://www.cssscript.com/confetti-falling-animation/


const sectors = [
  { color: "#f82", label: "Stack", bet: 20 },
  { color: "#0bf", label: "10", bet: 30 },
  { color: "#fb0", label: "200", bet: 10 },
  { color: "#0fb", label: "50", bet: 50 },
  { color: "#b0f", label: "100", bet: 20 },
  { color: "#f0b", label: "5", bet: 100 },
  { color: "#bf0", label: "500", bet: 10 },
];

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
let angVel = 0;    // Current angular velocity
let ang = 0;       // Angle rotation in radians
let isSpinning = false;
let isAccelerating = false;
let radiansSum = 0; // Sum of current anglerotation
let sectorsPositions = []; // keeps track of all sectors winning positions

let prizePool = 0;
sectors.forEach(calculatePrizePool);

console.log(sectorsPositions);

// calculates the total prizepool of all users in the game. 
function calculatePrizePool(section) {
  prizePool += section.bet;
}

//* Gets the current sector which the pointer is on */
//const getIndex = () => Math.floor(tot - ang / TAU * tot) % tot;


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
  currentSectorColor = determineWinner(TAU - ang)[3];
  console.log(currentSectorColor);
  ctx.canvas.style.transform = `rotate(${ang - PI / 2}rad)`;
  elSpin.textContent = !angVel ? "SPIN" : `${prizePool} DKK`;
  elSpin.style.background = "green";
};

const frame = () => {

  if (!isSpinning) return;

  if (angVel >= angVelMax) isAccelerating = false;

  // Accelerate
  if (isAccelerating) {
    angVel ||= angVelMin; // Initial velocity kick
    angVel *= 1.06; // Accelerate
  }

  // Decelerate
  else {
    isAccelerating = false;
    angVel *= friction; // Decelerate by friction  

    // SPIN END: Wheel is standing still
    if (angVel < angVelMin) {
      isSpinning = false;
      // TAU - ang because then TAU is the full circle and then subtract the current ang it is on
      const winner = determineWinner(TAU - ang)[0];
      if (winner) {
        console.log(`The winner is ${winner}`);
      } else {
        console.log("No winner was determined.");
      }
      angVel = 0;
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
  isSpinning = true;
  isAccelerating = true;
  angVelMax = rand(0.25, 0.40);
  stopConfetti();
});

// INIT
sectors.forEach(drawSector);
rotate(); // Initial rotation
engine(); // Start engine!










// ********************** Confetti *****************
var maxParticleCount = 100; //set max confetti count
var particleSpeed = 2; //set the particle animation speed
var startConfetti; //call to start confetti animation
var stopConfetti; //call to stop adding confetti
var toggleConfetti; //call to start or stop the confetti animation depending on whether it's already running
var removeConfetti; //call to stop the confetti animation and remove all confetti immediately

(function() {
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
		window.requestAnimFrame = (function() {
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
			window.addEventListener("resize", function() {
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