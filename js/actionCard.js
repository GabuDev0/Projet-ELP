import Card from "./card.js"

export default class ActionCard extends Card {
  constructor(type, action) {
    super(type);
    this.action = action;
  }
  toString() {
    return `Card ${this.action}`;
  }
}