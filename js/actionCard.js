import Card from "./card.js"

export default class ActionCard extends Card {
  constructor(action) {
    super("actionCard");
    this.action = action;
  }
  toString() {
    return `{Card ${this.action}}`;
  }
}