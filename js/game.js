import NumberCard from "./numberCard.js";
import ActionCard from "./actionCard.js";
import ModifierCard from "./modifierCard.js";
import Player from "./player.js";
import readline from "readline";
import fs from "fs/promises";

// ------------------- Game Setup -------------------

function fillGameDeck() {
    const gameDeck = [];

    // Number cards 0-12
    for (let index = 0; index < 13; index++) {
        const numberCard = new NumberCard(index);
        for (let j = 0; j < index + 1; j++) { // push multiples
            gameDeck.push(numberCard);
        }
    }

    // Modifier cards
    for (let i = 1; i < 6; i++) {
        gameDeck.push(new ModifierCard("+", i * 2));
    }
    gameDeck.push(new ModifierCard("x", 2));

    // Action cards
    for (let i = 0; i < 3; i++) {
        gameDeck.push(new ActionCard("freeze"));
        gameDeck.push(new ActionCard("flip three"));
        gameDeck.push(new ActionCard("second chance"));
    }

    return gameDeck;
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function showDeck(deck) {
    deck.forEach(c => console.log(c.toString()));
}

// ------------------- Game Logic -------------------

function resetPlayerForNewTurn(player) {
    player.hand = [];
    player.busted = false;
}

function isTurnFinished(player) {
    return player.busted || player.hand.length >= 7;
}

function freezeCard(player) {
    player.busted = true;
    player.hand = [];
}

async function choosePlayer(players, rl) {
    return new Promise(resolve => {
        rl.question("Which player do you choose? ", (answer) => {
            const id = Number(answer);
            if (!isNaN(id) && id >= 0 && id < players.length) {
                resolve(players[id]);
            } else {
                console.log("Invalid player.");
                resolve(choosePlayer(players, rl));
            }
        });
    });
}

async function resolveActionCard(card, deck, player, players, rl, discardDeck) {
    if (card.action === "freeze") {
        freezeCard(player);
        return "busted";
    } else if (card.action === "flip three") {
        return await flipThree(deck, player, players, rl, discardDeck);
    } else if (card.action === "second chance") {
        return "ok";
    }
}

async function drawCard(deck, player, actionQueue, players, rl, discardDeck) {
    if (deck.length === 0) {
        deck.push(...discardDeck);
        discardDeck.length = 0;
        shuffleDeck(deck);
        console.log("Deck was empty, reshuffled discard pile into deck.");
    }

    const card = deck.pop();
    console.log(`Player ${player.ID} draws ${card.toString()}`);

    if (card.type === "NumberCard") {
        if (player.hand.some(c => c.value === card.value)) {
            player.busted = true;
            return "busted";
        }
        player.hand.push(card);
    } else if (card.type === "ActionCard") {
        actionQueue.push(card);
        return await resolveActionCard(card, deck, player, players, rl, discardDeck);
    } else if (card.type === "ModifierCard") {
        player.hand.push(card);
    }

    return "ok";
}

async function flipThree(deck, player, players, rl, discardDeck) {
    const actionQueue = [];
    for (let i = 0; i < 3; i++) {
        if (isTurnFinished(player)) break;
        const result = await drawCard(deck, player, actionQueue, players, rl, discardDeck);
        if (result === "busted") {
            console.log("Busted during flip three!");
            const chosenPlayer = await choosePlayer(players, rl);
            console.log(`Giving remaining action cards to Player ${chosenPlayer.ID}`);
            chosenPlayer.hand.push(...actionQueue);
            return "busted";
        }
    }

    for (const card of actionQueue) {
        const result = await resolveActionCard(card, deck, player, players, rl, discardDeck);
        if (result === "busted") return "busted";
    }

    return "ok";
}

// ------------------- Player Turn -------------------

async function playerTurn(player, deck, rl, players, discardDeck) {
    resetPlayerForNewTurn(player);

    while (!isTurnFinished(player)) {
        const answer = await new Promise(resolve => rl.question("Continue to flip? (y/n) ", resolve));
        if (answer.toLowerCase() === "n") {
            console.log(`Player ${player.ID} stops. Hand:`, player.hand);
            break;
        }

        const result = await drawCard(deck, player, [], players, rl, discardDeck);
        if (result === "busted") {
            console.log(`Player ${player.ID} busted!`);
            break;
        }
    }
}

// ------------------- Game Rounds -------------------

function computeRoundScore(player) {
    if (player.busted) return 0;
    return player.hand.reduce((sum, c) => sum + (c.value || 0), 0);
}

function discardCards(discardDeck, players) {
    for (const player of players) {
        discardDeck.push(...player.hand);
        player.hand = [];
    }
}

function getWinner(players) {
    const maxPoints = Math.max(...players.map(p => p.points));
    return players.find(p => p.points === maxPoints);
}

async function gameRound(players, deck, rl, discardDeck) {
    for (const player of players) {
        await playerTurn(player, deck, rl, players, discardDeck);
    }

    for (const player of players) {
        const sum = computeRoundScore(player);
        player.points += sum;
        console.log(`Player ${player.ID} scored ${sum} points. Total: ${player.points}`);
    }

    discardCards(discardDeck, players);

    const winner = getWinner(players);
    if (winner && winner.points >= 200) {
        console.log(`=== Game Over ===\nWinner: ${winner.ID} with ${winner.points} points`);
        rl.close();
        return true;
    }
    return false;
}

async function startGame(players, deck, rl, discardDeck) {
    let round = 1;
    while (true) {
        console.log(`\n=== Round ${round} ===`);
        const finished = await gameRound(players, deck, rl, discardDeck);
        if (finished) break;
        round++;
    }
}

// ------------------- Run Game -------------------

const gameDeck = fillGameDeck();
const discardDeck = [];
shuffleDeck(gameDeck);
showDeck(gameDeck);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const players = [new Player("P1"), new Player("P2")];

startGame(players, gameDeck, rl, discardDeck);

// Save turn data
fs.writeFile("data.txt", "Turn data saved").then(() => {
    console.log("-- Turn data saved in data.txt");
});
