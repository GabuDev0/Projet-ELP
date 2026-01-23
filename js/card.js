export default class Card {
  constructor(type) { // type: "str"
    this.type = type;
  }
  toString() {
    return `Card ${this.type}`;
  }
}