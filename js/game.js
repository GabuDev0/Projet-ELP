import NumberCard from "./numberCard.js"
import ActionCard from "./actionCard.js"
import ModifierCard from "./modifierCard.js";
import Player from "./player.js";

import readline from "readline";
import fs from 'fs';

function fillGameDeck() {
    const gameDeck = []

    // Add number cards
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

function deckToString (deck){
	if (deck.length === 0) {
		return "empty";
	}
	return deck.map(card => card.toString()).join(", ");
}

// When the player draws a freeze card, will be eliminated of the turn and lose all the accumulated cards / points (for the turn)
function freezeCard(player) {
    player.busted = true
    player.hand = []
}

function flipThree(deck, player) {
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
	if (player.busted) {
		return 0;
	}
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


function playerTurn(player, deck, rl, onEnd) {
	if (isTurnFinished(player)) {
		onEnd();
		return;
	}

	rl.question("Continue to flip? (y/n)", (answer) => {
        if (answer === "n") {
			console.log("Player chooses to stop. Turn ended.");
            console.log("Hand cards:", player.hand, player.modif);
            onEnd();
            return;
        }
	
		const card = drawCard(deck, player, discard_deck);

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
			playerTurn(player, deck, rl, onEnd);
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
		playerTurn(player, deck, rl, () => {
			playerIndex++;
			nextPlayer();
		})
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
			discard(discard_deck, players);
			record("game_records.txt", roundIndex, deck, discard_deck, players);
			const winner = getWinner(players);
			if (winner != null) {
				console.log("=== Game Over ===");
				console.log("Winner:", winner.ID, "with", winner.points, "points");
				rl.close();
				return;
			}
			roundIndex ++;
			nextRound();
		});
	}

	nextRound();
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
