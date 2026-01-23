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

function drawCard(deck, player){
	const card = deck.pop();
	if (card.type === "NumberCard") {
		const duplicate = player.hand.some(c => c.value === card.value);
		console.log(player.ID, "gets", card.toString());
		if (duplicate) {
			player.busted = true;
			return {status: "busted", card: card};
		}
	}
	
	player.hand.push(card);
	return {status: "ok", card: card};
}

function shuffleDeck(deck) {
	for (let i = deck.length - 1; i > 0; i-- ){
		const j = Math.floor(Math.random() * (i + 1));
		[deck[i], deck[j]] = [deck[j], deck[i]];
	}
}

// gameDeck: [Card], discardPile: [Card], playerPoints: [int]
const saveTurnToFile = async (filename, gameDeck, discardPile, playerPoints) => {

    await fs.writeFile(filename, "YOU KCOIEAHPFHAE IHFPIAH F PZ");

    return filename;
}

const gameDeck = fillGameDeck()
showDeck(gameDeck)

saveTurnToFile("data.txt", gameDeck, [], [123, 44]).then(filename => {
    console.log("-- Turn data saved in: ", filename);
}).catch(console.error)