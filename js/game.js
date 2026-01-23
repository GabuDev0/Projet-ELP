import NumberCard from "./numberCard.js"
function FillGameDeck() {
    const gameDeck = []
    for (let index = 0; index < 13; index++) {
        const numberCard = new NumberCard("numberCard", index);
        for (let j = 0; j < index; j++) {
            gameDeck.push(numberCard);
        }
        
    }
    return gameDeck;
}

console.log(FillGameDeck());