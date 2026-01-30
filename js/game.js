import NumberCard from "./numberCard.js"
import ActionCard from "./actionCard.js"
import ModifierCard from "./modifierCard.js";
import Player from "./player.js";
import readline from "readline";

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
		if (isTurnFinished(player)) {
			return;
    	}
        const card = drawCard(deck, player, discard_deck);
	}
}

function drawCard(deck, player, discard_deck){
	if (deck.length === 0) {
		for (const card of discard_deck) {
			deck.push(card);
		}
		shuffleDeck(deck);
		discard_deck.length = 0;
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

	const card = deck.pop();
	console.log("Player ", player.ID, " gets ", card.toString());
	if (card.type === "NumberCard") {
		const duplicate = player.hand.some(c => c.value === card.value);
		if (duplicate) {
			player.busted = true;
			return card;
		}
		player.hand.push(card);
	} else if (card.type === "ActionCard") {
		player.action.push(card);
	} else if (card.type === "ModifierCard") {
		player.modif.push(card);
	}
	return card;
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
  if (player.hand.length >= 7) return true;
  return false;
}

function computeRoundScore(player) {
	if (player.busted) {
		return 0;
	}
	let sum = 0;
	for (const card of player.hand) {
		sum += card.value;
	}
	return sum;
}

function getWinner(players) {
	if (players.some(p => p.points >= 200)) {
		const maxScore = Math.max(...players.map(p => p.points))
		for (const p of players) {
			if (p.points === maxScore) {
				return p;
			}
		}
	} else {
		return null;
	}
}

function discard (discard_deck, players){
	for (const player of players) {
		for (const card of player.hand) {
			discard_deck.push(card)
		}
	}
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
	
		const result = await drawCard(deck, player, [], players, rl); // string

		if (isTurnFinished(player)) {
			if (player.busted) {
				console.log("Player", player.ID, "is busted. Turn ended.");
			} else {
				console.log("Player ",player.ID, " has flipped 7 number cards successfully. Turn ended.");
			}
			onEnd();
			return;
		} else {
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

function startGame(players, deck, rl, discard_deck) {
	let roundIndex = 1;

	function nextRound() {
		console.log(`Round ${roundIndex}`);
		gameRound(players, deck, rl, () => {
			for (const player of players) {
				const sum = computeRoundScore(player);
				player.points += sum;
				console.log("Player ", player.ID, " got ", sum, " points in this round. Total points: ", player.points, ".")
			}
			const winner = getWinner(players);
			if (winner != null) {
				console.log("=== Game Over ===");
				console.log("Winner:", winner.ID, "with", winner.points, "points");
				rl.close();
				return;
			}
			discard(discard_deck, players);
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

const gameDeck = fillGameDeck();
const discard_deck = [];
shuffleDeck(gameDeck);
showDeck(gameDeck);
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const player1 = new Player("P1");
const player2 = new Player("P2");
const players = [player1, player2];
startGame(players, gameDeck, rl, discard_deck);
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