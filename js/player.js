export default class Player {
  constructor(ID) { // type: "str"
    this.ID = ID;
	this.hand = [];
	this.action = [];
	this.modif = [];
	this.busted = false;
	this.success = false;
	this.points = 0
  }
  toString() {
    return `{Player ${this.ID} | hand cards:[${this.hand.join(", ")}]. | Busted: ${this.busted}}`;
  }
}