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
        if (index == 0) {
            gameDeck.push(new NumberCard(index));
        }
        for (let j = 0; j < index; j++) {
            gameDeck.push(new NumberCard(index));
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

// When the player draws a freeze card, will be eliminated of the turn and lose all the accumulated cards / points (for the turn)
function deckToString (deck){
	if (deck.length === 0) {
		return "empty";
	}
	return deck.map(card => card.toString()).join(", ");
}

function freezeCard(player, players) {
    player.busted = true
}

// Draw 3 cards
async function flipThree(deck, player, players, rl, discard_deck) {
	const actionQueue = []

	for (let i = 0; i < 3; i++) {
		if (isTurnFinished(player)) return;

		const result = await drawCard(deck, player, discard_deck, players, rl, actionQueue);

		if (result === "busted") {
			console.log("Busted during flip three!");

			const playerChosen = await choosePlayer(players, rl);
			console.log("Giving remaining action cards to Player", playerChosen.ID);

			// bug here
			for (const card of player.actions) {
				playerChosen.hand.push(card);
			}
			player.actions = []
			return "busted";
		}
	}

	for (const actionCard of actionQueue) {
		const result = await resolveActionCard(actionCard, deck, player, players, rl, discard_deck);
		if(result === "busted") return "busted";
	}

	return "ok";
}

async function drawCard(deck, player, discard_deck, players, rl, actionQueue = null){
	console.log(`Deck remaining: ${deck.length} cards\n`);
	console.log(`Discard pile: ${discard_deck.length} cards:\n`);
	if (deck.length === 0) {
		deck.push(...discard_deck);
		shuffleDeck(deck);
		discard_deck.length = 0;
	}

	const card = deck.pop();
	console.log("Player ", player.ID, " got ", card.toString())

	if (card.type === "NumberCard") {
		const duplicate = player.hand.some(c => c.value === card.value);
		if (duplicate) {
			player.busted = true;
			return "busted";
		}
		player.hand.push(card);
		if (player.hand.length === 7) {
			player.success = true
		}
	}

	
	// ACTION CARD
	else if (card.type === "ActionCard") {
		if (actionQueue) {
			actionQueue.push(card);
			return "ok";
		}
		player.actions.push(card);
		return await resolveActionCard(card, deck, player, players, rl, discard_deck);
	}

	else if (card.type === "ModifierCard" ) {
		player.modif.push(card);
	}

	return "ok";
}

async function resolveActionCard(card, deck, player, players, rl, discard_deck) {

	discard_deck.push(card);

	if (card.action === "freeze") {
		console.log("freeeeeeeeze")
		freezeCard(player, players)
		return "busted"
	}
	else if (card.action === "flip three"){
		console.log("FLIP THREEEE")
		return await flipThree(deck, player, players, rl, discard_deck)
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
	player.actions = [];
  	player.busted = false;
	player.success = false;
}

function isTurnFinished(player) {
	if (player.busted) return true;
	let i = 0
	for (const card of player.hand) {
		if (card.type === "NumberCard") {
			i = i + 1
		}
	}
	return i === 7
}

function computeRoundScore(player) {
	if (player.busted) return 0;

	let sum = 0;
	for (const card of player.hand) {
		sum += card.value;
	}
	for (const card of player.hand) {
		if (card.type === "ModifierCard") {
			switch (card.operation) {
				case "+":
					sum += card.value;
					break;
				case "x":
					sum *= card.value;
					break;
				default:
					console.log("Unknown modifier card:", card);
			}
		}
		
	}
	
	if (player.success) {
		sum += 15;
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

function discard(discard_deck, players){
	for (const player of players) {
		for (const card of player.hand) discard_deck.push(card)
		for (const modifCard of player.modif) discard_deck.push(modifCard)
		for (const actionCard of player.actions) discard_deck.push(actionCard)
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

async function playerTurn (player, deck, rl, onEnd, players, discard_deck){
	if (isTurnFinished(player)) {
		onEnd();
		return;
	}

	rl.question("Continue to flip? (y/n)", async (answer) => {
        if (answer === "n") {
			console.log("Player chooses to stop. Turn ended.");
            console.log("Hand cards:", player.hand, player.modif);
            onEnd();
            return;
        }

		await drawCard(deck, player, discard_deck, players, rl);

		if (isTurnFinished(player)) {
			if (player.busted)
				console.log("Player", player.ID, "is busted.");
			else
				console.log("Player", player.ID, "reached 7 cards.");

			onEnd();
			return;
		} else {
			playerTurn(player, deck, rl, onEnd, players, discard_deck);
			return;
		}
	});
}

function gameRound(players, deck, rl, onRoundEnd, discard_deck) {
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
		}, players, discard_deck);
	}

	nextPlayer();
}

function startGame(players, deck, rl, discard_deck) {
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
			roundIndex ++;
			nextRound();
		}, discard_deck);
	}

	nextRound();
}


const gameDeck = fillGameDeck();
shuffleDeck(gameDeck);
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const players = [new Player("P1"), new Player("P2")];

const discard_deck = []
startGame(players, gameDeck, rl, discard_deck);
