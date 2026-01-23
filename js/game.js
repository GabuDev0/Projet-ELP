import NumberCard from "./numberCard.js"
function fillGameDeck() {
    const gameDeck = []
    for (let index = 0; index < 13; index++) {
        const numberCard = new NumberCard("numberCard", index);
        for (let j = 0; j < index; j++) {
            gameDeck.push(numberCard);
        }
        
    }
    return gameDeck;
}

function showDeck(deck) {
    deck.forEach(element => {
        console.log(element.toString())
    });
}

const gameDeck = fillGameDeck()
showDeck(gameDeck)