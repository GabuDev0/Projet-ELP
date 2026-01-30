import Card from "./card.js"

export default class ModifierCard extends Card {
  constructor(operation, value) { // Example: ModifierCard of + operatino and 10 value will add 10 to the score
    super("ModifierCard");
    this.value = value;
    this.operation = operation
  }
  toString() {
    return `{Card ${this.operation} ${this.value}}`;
  }
}