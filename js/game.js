import NumberCard from "./numberCard.js"
import ActionCard from "./actionCard.js"
import ModifierCard from "./modifierCard.js";
import Player from "./player.js";


import fs from 'fs/promises';

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
        const card = drawCard(deck, player);
	}
}

function drawCard(deck, player){
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

function playerTurn(player, deck, rl, onEnd) {
	if (isTurnFinished(player)) {
		onEnd();
		return;
	}

	rl.question("Continue to flip? (y/n)", (answer) => {
        if (answer === "n") {
			console.log("Player chooses to stop. Turn ended.");
            console.log("Hand cards:", player.hand);
            onEnd();
            return;
        }
	
		const card = drawCard(deck, player);

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
				console.log("Player ", player.ID, " got ", sum, " points in this round. Total points: ", player.points, ".")
			}
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