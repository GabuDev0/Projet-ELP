# JS project

Project planning:

Entities
Server (game)
Client (player)



Game logic:
Card struct
Card list
Turn:
    DrawCard()
turnEnded: bool


TODO:
*
Card struct with all the number cards or modifier cards or action cards

gameDeckCards: Card list with all the drawable cards for the game

playerCards: card list with all the cards that belong to the player

discardPile: cards from an old turn



DrawCard() which gives a random card in the deck

FillGameDeck(): fill the gameDeck. Will also be called if gameDeckCards is empty.


*
Client / Server
The client connects to the server

The server sends the current state of the game after each play (cards in the deck of the players, the players points...)
The server asks the client for choices on each turn (draw or stop)
