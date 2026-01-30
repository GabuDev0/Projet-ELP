import NumberCard from "./numberCard.js"
import ActionCard from "./actionCard.js"
import ModifierCard from "./modifierCard.js";
import Player from "./player.js";
import readline from "readline";
import fs from 'fs';
import { start } from "repl";

function fillGameDeck() {
    const gameDeck = []

    for (let index = 0; index < 13; index++) {
        const numberCard = new NumberCard(index);
        if (index == 0) {
            gameDeck.push(numberCard);
        }
        for (let j = 0; j < index; j++) {
            gameDeck.push(numberCard);
        }
    }

    for (let i = 1; i < 6; i++) {
        const modifierCardPlus = new ModifierCard("+", i*2)
        gameDeck.push(modifierCardPlus);
    }
    const modifierCardMult = new ModifierCard("x", 2)
    gameDeck.push(modifierCardMult)

    for (let i = 0; i < 3; i++) {
        gameDeck.push(new ActionCard("freeze"));
        gameDeck.push(new ActionCard("flip three"));
        gameDeck.push(new ActionCard("second chance"));
    }
    return gameDeck;
}

function showDeck(deck) {
    deck.forEach(element => console.log(element.toString()));
}

function deckToString (deck){
	if (deck.length === 0) {
		return "empty";
	}
	return deck.map(card => card.toString()).join(", ");
}

// When the player draws a freeze card, will be eliminated of the turn and lose all the accumulated cards / points (for the turn)
function deckToString (deck){
	if (deck.length === 0) {
		return "empty";
	}
	return deck.map(card => card.toString()).join(", ");
}

function freezeCard(player) {
    player.busted = true
    player.hand = []
}

// Draw 3 cards
async function flipThree(deck, player, players, rl) {
	const actionQueue = []

	for (let i = 0; i < 3; i++) {
		if (isTurnFinished(player)) return;

		const result = await drawCard(deck, player, [], players, rl, actionQueue);

		if (result === "busted") {
			console.log("Busted during flip three!");

			const playerChosen = await choosePlayer(players, rl);
			console.log("Giving remaining action cards to Player", playerChosen.ID);

			for (const card of actionQueue) {
				playerChosen.hand.push(card);
			}
			return "busted";
		}
	}

	for (const actionCard of actionQueue) {
		const result = await resolveActionCard(actionCard, deck, player, players, rl);
		if(result === "busted") return "busted";
	}

	return "ok";
}

async function drawCard(deck, player, discard_deck = [], players, rl, actionQueue = null){
	if (deck.length === 0) {
		for (const card of discard_deck) deck.push(card);
		shuffleDeck(deck);
		discard_deck.length = 0;
	}

	const card = deck.pop();
	console.log("Player ", player.ID, " got ", card)

	// ACTION CARD
	if (card instanceof ActionCard) {
		if (actionQueue) {
			actionQueue.push(card);
			return "ok";
		}
		return await resolveActionCard(card, deck, player, players, rl);
	}

	// NORMAL CARD
	player.hand.push(card);

	return "ok";
}

async function resolveActionCard(card, deck, player, players, rl) {
	if (card.action === "freeze") {
		console.log("freeeeeeeeze")
		freezeCard(player)
		return "busted"
	}
	else if (card.action === "flip three"){
		console.log("FLIP THREEEE")
		return await flipThree(deck, player, players, rl)
	}
	else if (card.action === "second chance") {
		console.log("you got a second chance")
		return "ok"
	}
	return "ok";
}

function shuffleDeck(deck) {
	for (let i = deck.length - 1; i > 0; i-- ){
		const j = Math.floor(Math.random() * (i + 1));
		[deck[i], deck[j]] = [deck[j], deck[i]];
	}
}

function resetPlayerForNewTurn(player) {
  	player.hand = [];
	player.modif = [];
	player.action = [];
  	player.busted = false;
}

function isTurnFinished(player) {
  if (player.busted) return true;
  if (player.hand.length >= 7) return true;
  return false;
}

function computeRoundScore(player) {
	if (player.busted) return 0;

	let sum = 0;
	for (const card of player.hand) {
		sum += card.value;
	}
	for (const modif of player.modif) {
		switch (modif.operation) {
			case "+":
				sum += modif.value;
				break;
			case "x":
				sum *= modif.value;
				break;
			default:
				console.log("Unknown modifier:", modif);

		}
	}
	return sum;
}

function getWinner(players) {
	if (players.some(p => p.points >= 200)) {
		const maxScore = Math.max(...players.map(p => p.points))
		return players.find(p => p.points === maxScore);
	}
	return null;
}

function discard (discard_deck, players){
	for (const player of players) {
		for (const card of player.hand) discard_deck.push(card)
	}
}

function record(filename, roundIndex, gameDeck, discard_deck, players){
	let output = "";
	output += `===== ROUND ${roundIndex} =====\n`;

	output += "Players:\n";
	for (const p of players) {
		output += `- Player ${p.ID}: ${p.points} points\n`;
	}

	output += `Deck remaining: ${gameDeck.length} cards\n`;
	output += `Discard pile: ${discard_deck.length} cards:\n`;
	output += deckToString(discard_deck) + "\n\n";


	output += "\n";

	fs.appendFileSync(filename, output);
}


function choosePlayer(players, rl) {
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
            console.log("Hand cards:", player.hand, player.modif);
            onEnd();
            return;
        }

		await drawCard(deck, player, [], players, rl);

		if (isTurnFinished(player)) {
			if (player.busted)
				console.log("Player", player.ID, "is busted.");
			else
				console.log("Player", player.ID, "reached 7 cards.");

			onEnd();
		} else {
			playerTurn(player, deck, rl, onEnd, players);
		}
	});
}

function gameRound(players, deck, rl, onRoundEnd) {
	let playerIndex = 0;

	function nextPlayer() {
		if (playerIndex >= players.length) {
			onRoundEnd();
			return;
		}

		const player = players[playerIndex];
		console.log("Player ", player.ID, "'s turn ---");
		resetPlayerForNewTurn(player);

		playerTurn(player, deck, rl, () => {
			playerIndex++;
			nextPlayer();
		}, players);
	}

	nextPlayer();
}

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
			for (const player of players) {
				const sum = computeRoundScore(player);
				player.points += sum;
				console.log("Player", player.ID, "got", sum, "points. Total:", player.points)
			}
			discard(discard_deck, players);
			record("game_records.txt", roundIndex, deck, discard_deck, players);
			const winner = getWinner(players);
			if (winner) {
				console.log("Winner:", winner.ID);
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


const gameDeck = fillGameDeck();
shuffleDeck(gameDeck);
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const players = [new Player("P1"), new Player("P2")];
startGame(players, gameDeck, rl);
