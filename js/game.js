import NumberCard from "./numberCard.js"
import ActionCard from "./actionCard.js"
import ModifierCard from "./modifierCard.js";
import Player from "./player.js";
import readline from "readline";


import fs from 'fs/promises';
import { start } from "repl";

function fillGameDeck() {
    const gameDeck = []

    // Add number cards
	// index < 13
    for (let index = 0; index < 13; index++) {
        const numberCard = new NumberCard(index);
        if (index == 0) {
            gameDeck.push(numberCard);
        }
        for (let j = 0; j < index; j++) {
            gameDeck.push(numberCard);
        }
    }

    // Add modifier cards
	// i < 6
    for (let i = 1; i < 6; i++) {
        const modifierCardPlus = new ModifierCard("+", i*2)
        gameDeck.push(modifierCardPlus);
    }
    const modifierCardMult = new ModifierCard("x", 2)
    gameDeck.push(modifierCardMult)

    
    // Add action cards
    for (let i = 0; i < 3; i++) {
        const actionCard1 = new ActionCard("freeze");
        const actionCard2 = new ActionCard("flip three");
        const actionCard3 = new ActionCard("second chance");

        gameDeck.push(actionCard1);
        gameDeck.push(actionCard2);
        gameDeck.push(actionCard3);
    }
    return gameDeck;
}

function showDeck(deck) {
    deck.forEach(element => {
        console.log(element.toString());
    });
}

// When the player draws a freeze card, will be eliminated of the turn and lose all the accumulated cards / points (for the turn)
function freezeCard(player) {
    player.busted = true
    player.hand = []
}

// Draw 3 cards
async function flipThree(deck, player, players, rl) {
	const actionQueue = []
	let result = "ok"
    for (let i = 0; i < 3; i++) {
        result = await drawCard(deck, player, actionQueue, players, rl);

		// BUG: if result == freeze, the player stops drawing cards, and don't give its remaining action cards to the other player
		if (result === "busted") {
			console.log("Busted during flip three!");
			if (!players) {
				throw new Error("players is undefined in flipThree");
			}
			const playerChosen = await choosePlayer(players, rl)
			console.log("Giving remaining action cards to Player", playerChosen.ID);

			// Push the remaining action cards in the chosen player's hand
			for (const card of actionQueue) {
				playerChosen.hand.push(card);
			}

			return "busted";
		}
	}
	for (const actionCard of actionQueue) {
		const result = await resolveActionCard(actionCard, deck, player, players, rl);
		if(result === "busted") {
			return "busted"
		}
	}
	return result; // success or ok
}
async function resolveActionCard(card, deck, player, players, rl) {
	if (card.action === "freeze") {
		console.log("freeeeeeeeze")
		freezeCard(player)
		return "busted"
	}
	else if (card.action === "flip three"){
		console.log("FLIP THREEEE")
		if (!players) {
			throw new Error("players is undefined in resolveActionCard");
		}
		return await flipThree(deck, player, players, rl)
	}
	else if (card.action === "second chance") {
		console.log("you got a second chance")
		return "ok"
	}
}
// Deck, Player -> string
// Returns the status of the draw (busted, ok or success (turn ends))
async function drawCard(deck, player, actionQueue, players, rl){
	if (player.hand.length < 7) {
		const card = deck.pop();
		console.log("Player ", player.ID, " gets ", card.toString());
		if (card.type === "NumberCard") {
			const duplicate = player.hand.some(c => c.value === card.value);
			if (duplicate) {
				player.busted = true;
				return "busted";
			}
		}

		player.hand.push(card);

		// Adds it to an action queue
		if (card.type === "ActionCard") {
			console.log(actionQueue)
			if (actionQueue.length != 0) {
				actionQueue.push(card)
				return "ok";
			}
			if (!players) {
				throw new Error("players is undefined in drawCard");
			}
			return await resolveActionCard(card, deck, player, players, rl);
		}

		return "ok";
	} else {
		return "success";
	}
}

function shuffleDeck(deck) {
	for (let i = deck.length - 1; i > 0; i-- ){
		const j = Math.floor(Math.random() * (i + 1));
		[deck[i], deck[j]] = [deck[j], deck[i]];
	}
}

function resetPlayerForNewTurn(player) {
  	player.hand = [];
  	player.busted = false;
}

function isTurnFinished(player) {
  if (player.busted) return true;
  if (player.hand.length === 7) return true;
  return false;
}

function choosePlayer(players, rl) {
	if (!players) {
		throw new Error("players is undefined in choosePlayer");
	}

	return new Promise(resolve => {
		rl.question("Which player do you choose ?", (answer) => {
			const id = Number(answer);

			if (!isNaN(id) && id >= 0 && id < players.length) {
				resolve(players[id]);
			} else {
				console.log("Invalid player");
				resolve(choosePlayer(players, rl));
			}
		});
	});
}


async function playerTurn (player, deck, rl, onEnd, players){
	rl.question("Continue to flip? (y/n)", async (answer) => {
        if (answer === "n") {
			console.log("Player chooses to stop. Turn ended.");
            console.log("Hand cards:", player.hand);
            onEnd();
            return;
        }
		
		if (!players) {
			throw new Error("players is undefined in playerTurn");
		}
		const result = await drawCard(deck, player, [], players, rl); // string
		switch (result) {
			case "busted":
				console.log("Player ", player.ID, " is busted. Turn ended.");
				onEnd();
        		return;
			case "success":
				console.log("Player ",player.ID, " has flipped 7 number cards successfully. Turn ended.");
				onEnd();
        		return;
			case "ok":
				console.log("Player ", player.ID, " is safe. Turn continues.");
				playerTurn(player, deck, rl, onEnd, players);
        		return;
		}
	});
}


function gameRound(players, deck, rl, onRoundEnd) {
	let playerIndex = 0;

	function nextPlayer() {
		if (playerIndex >= players.length) {
			console.log("All players have finished their turns.");
			onRoundEnd();
			return;
		}

		const player = players[playerIndex];
		console.log("Player ", player.ID, "'s turn ---");
		resetPlayerForNewTurn(player);
		playerTurn(player,
			deck,
			rl,
			() => {
				playerIndex++;
				nextPlayer();
			},
			players
			)
	}

	nextPlayer();
}

// BUG: if deck is empty, should fill again
function startGame(players, deck, rl) {
	let roundIndex = 1;

	function nextRound() {
		if (players.some(p => p.points >= 200)){
			console.log("Game finished");
			rl.close();
			return;
		}

		console.log(`Round ${roundIndex}`);
		gameRound(players, deck, rl, () => {
			roundIndex ++;
			nextRound();
		});
	}

	nextRound();
}


// gameDeck: [Card], discardPile: [Card], playerPoints: [int]
const saveTurnToFile = async (filename, gameDeck, discardPile, playerPoints) => {
    await fs.writeFile(filename, "YOU KCOIEAHPFHAE IHFPIAH F PZ");

    return filename;
}

const gameDeck = fillGameDeck()
shuffleDeck(gameDeck)
showDeck(gameDeck)

saveTurnToFile("data.txt", gameDeck, [], [123, 44]).then(filename => {
    console.log("-- Turn data saved in: ", filename);
}).catch(console.error)

const player1 = new Player(0)
const player2 = new Player(1)

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
startGame([player1, player2], gameDeck, rl)