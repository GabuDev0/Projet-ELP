import Card from "./card.js"

export default class NumberCard extends Card {
  constructor(type, value) {
    super(type);
    this.value = value;
  }
  toString() {
    return `Card ${this.value}`;
  }
}