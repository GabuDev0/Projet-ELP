import Card from "./card.js"

export default class NumberCard extends Card {
  constructor(value) {
    super("NumberCard");
    this.value = value;
  }
  toString() {
    return `{Card ${this.value}}`;
  }
}