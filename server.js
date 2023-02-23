const { getDatabase } = require('firebase-admin/database');
const admin = require("firebase-admin"); // documentation - https://firebase.google.com/docs/admin/setup?authuser=0
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://wheel-be259-default-rtdb.europe-west1.firebasedatabase.app"
});

const db = getDatabase();
// need to figure a way to registrer which gameID should be updated

const path = require('path');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

let clientDir = path.join(__dirname, 'client')
let staticDir = path.join(clientDir, 'public')

app.use(express.static(staticDir))
// Remember we need to tell the app to accept and gulp json
app.use(express.json())

//app root
app.get('/', mainHandler);
app.get('/login', loginHandler);
app.get('/game', gameHandler);
app.get('/signup', signUpHandler);
//app.post('/game/:id', gameHandler)


function loginHandler(request, response) {
    response.sendFile(path.join(clientDir, "login.html"));
}

function signUpHandler(request, response) {
    response.sendFile(path.join(clientDir, "signup.html"))
}

function mainHandler(request, response) {
    response.sendFile(path.join(clientDir, "main.html"))
}

function gameHandler(request, response) {
    response.sendFile(path.join(clientDir, "index.html"))
}

let refThisGame;
// io socket listens for events. If someone connects for example
// on is always a callBack function
io.on("connection", (socket) => {
    console.log("User connected. ID is: " + socket.id);


    socket.on('startSpin', (gameID) => {
        refThisGame = db.ref('/games/' + gameID);
        refThisGame.on('value', (snapshot) => {
            ang = snapshot.val().lastAngle;
        }, (errorObject) => {
            console.log('The lastAngle read failed: ' + errorObject);
        });
        isSpinning = true;
        isAccelerating = true;
        gameAngles = [];
        // Wait for the game to generate gameAngles. It is getting generated because isSpinning and isAccelerating is set to true
        setTimeout(() => {
            let lastAngle = gameAngles[Object.keys(gameAngles).length - 1];
            refThisGame.update({
                gameAngles: gameAngles,
                lastAngle: lastAngle
            })
                .then(() => {
                    console.log("gameAngles update succesful.");
                })
                .catch((error) => {
                    console.log("gameAngles update failed");
                });
            refThisGame.update({
                winnerHasBeenFound: false
            })
                .then(() => {
                    console.log("winnerHasBeenFound update succesful. false");
                })
                .catch((error) => {
                    console.log("winnerHasBeenFound update failed");
                });
        }, 3000)
        // When isSpinning is set to true, the wheel starts to spin for all clients which are in this game 
        setTimeout(() => {
            refThisGame.update({
                isSpinning: true
            })
                .then(() => {
                    console.log("isSpinning update succesful. Set true");
                })
                .catch((error) => {
                    console.log("isSpinning update failed");
                });
        }, 6000)
    })


    socket.on('endSpin', (gameID) => {
        console.log("endSpin called by client");
        let winnerHasBeenFound;
        let sectorsPositions;
        let lastAngle;
        let prizePool;
        refThisGame = db.ref('/games/' + gameID);
        refThisGamePlayers = db.ref('/games/' + gameID + '/players');
        refThisGame.on('value', (snapshot) => {
            winnerHasBeenFound = snapshot.val().winnerHasBeenFound,
                sectorsPositions = snapshot.val().sectorsPositions,
                lastAngle = snapshot.val().lastAngle,
                prizePool = snapshot.val().prizepool

        }, (errorObject) => {
            console.log('Endgame data values failed: ' + errorObject);
        });
        // checks if the call to find the winner has been executed or not. This makes sure that we only call it once per win. 
        // All clients emits endSpin when the wheel has finished spinning, but only one client call should be executed.
        if (!winnerHasBeenFound) {
            refThisGame.update({
                winnerHasBeenFound: true,
                isSpinning: false
            })
                .then(() => {
                    console.log("winnerHasBeenFound and isSpinning update succesful. Set true");
                })
                .catch((error) => {
                    console.log("winnerHasBeenFound and isSpinning update failed");
                });
            // give the winner money
            let winnerUid = determineWinner(sectorsPositions, lastAngle)[4];
            console.log('winner is: ' + determineWinner(sectorsPositions, lastAngle)[4]);

            // give the prizepool to the winner
            let winnerRef = db.ref('/users/' + winnerUid);
            let currentMoney;
            // This section gives the prize to the winner and does a few more things to make it logical. 
            // gets how much money the winner currently has
            winnerRef.once('value', (snapshot) => {
                currentMoney = snapshot.val().money
                console.log(currentMoney);
                // give the player the money from prizepool
                let newMoney = +currentMoney + +prizePool;
                winnerRef.update({
                    money: newMoney
                })
                    .then(() => {
                        console.log("Winner has been given the prize.");
                    })
                    .catch((error) => {
                        console.log("prizepool reward failed to give");
                    });

                // update prizepool to 0
                refThisGame.update({
                    prizepool: 0
                })
                    .then(() => {
                        console.log("Prizepool reset to 0.");
                    })
                    .catch((error) => {
                        console.log("prizepool failed to reset");
                    });

            }, (errorObject) => {
                console.log('currentMoney read failed: ' + errorObject);
            });



            // remove all bets from players
            refThisGamePlayers.once('value')
                .then(function (snapshot) {
                    snapshot.forEach(function (childSnapshot) {
                        let uid = childSnapshot.val().uid;
                        let uidRef = db.ref('/games/' + gameID + '/players/' + uid);
                        uidRef.update({
                            bet: 0
                        })
                            .then(() => {
                                console.log("bet has been reset to 0");
                            })
                            .catch((error) => {
                                console.log("bet failed to reset to 0");
                            });
                    })
                })
        }
    })
    /*
    // be able to disconnect - runs when someone tries to disconnect
    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
    })
    */
});


let gameAngles;
let ang = 0;
let angVel = 0;
let isSpinning;
let isAccelerating;
const PI = Math.PI;
const TAU = 2 * PI; // the full circle - radians
const acceleration = 1.06; // How fast the wheel accelerates
const friction = 0.997;  // 0.995=soft, 0.99=mid, 0.98=hard - Deacelerate
const angVelMin = 0.0005; // Below that number will be treated as a stop
// Generate random float in range min-max:
const rand = (m, M) => Math.random() * (M - m) + m;
let angVelMax = rand(0.25, 0.40); // Random ang.vel. to acceletare to - it determines winner 

// Returns the winning sector according to the given ang the wheel has landed on
function determineWinner(sectorsPositions, ang) {
    // we need to adjust the angle according to the way the circle is made - We use Pi * 2 (omkreds)
    ang = Math.PI * 2 - ang;
    for (const i in sectorsPositions) {
        const sector = sectorsPositions[i];
        const start = sector[1];
        const end = sector[2];
        if (ang >= start && ang < end) {
            return sector;
        }
    }
    return "no winner found";
}


// ************ Wheel **********
const frame = () => {
    if (!isSpinning) return;

    if (angVel >= angVelMax) {
        isAccelerating = false;
    }
    // Accelerate
    if (isAccelerating) {
        if (angVel === 0) {
            angVel = angVelMin; // Initial velocity kick
        } 
        angVel *= acceleration; // Accelerate
    }

    // Decelerate
    else {
        isAccelerating = false;
        angVel *= friction; // Decelerate by friction
        // SPIN END: Wheel is standing still
        if (angVel < angVelMin) {
            console.log("spin has ended");
            console.log("angvel is: " + angVel + " and angVelMin is: " + angVelMin);
            console.log("ang is: " + ang);
            console.log("angVelMax is: " + angVelMax);
            isSpinning = false;
            // TAU - ang because then TAU is the full circle and then subtract the current ang it is on
            /*const winner = determineWinner(TAU - ang)[0];
            if (winner) {
                console.log(`The winner is ${winner}`);
            } else {
                console.log("No winner was determined.");
            }
            */
            angVel = 0;
            console.log(gameAngles);
        }
    }
    ang += angVel; // Update angle
    ang %= TAU;    // Normalize angle
    gameAngles.push(ang);
};

const engine = () => {
    frame();
    setImmediate(engine);
};

engine(); // Start engine!


server.listen(3000, () => {
    console.log('listening on *:3000');
})