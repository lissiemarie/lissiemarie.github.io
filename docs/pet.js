// Pet.js
export class Pet {
    constructor() {
        this._petType = 'none';
        this._petName = 'none';
        this._petAge = 0;
        this._dogSpaces = 30;
        this._catSpaces = 12;
        this._daysStay = 0;
        this._amountDue = 0.0;
    }

    // Getters
    get petType() { return this._petType; }
    get petName() { return this._petName; }
    get petAge() { return this._petAge; }
    get dogSpaces() { return this._dogSpaces; }
    get catSpaces() { return this._catSpaces; }
    get daysStay() { return this._daysStay; }
    get amountDue() { return this._amountDue; }

    // Setters
    set petType(type) { this._petType = type; }
    set petName(name) { this._petName = name; }
    set petAge(age) { this._petAge = age; }
    set dogSpaces(n) { this._dogSpaces = n; }
    set catSpaces(n) { this._catSpaces = n; }
    set daysStay(days) { this._daysStay = days; }
    set amountDue(amt) { this._amountDue = amt; }

    // Render to the console
    print() {
        console.log(`Pet type: ${this.petType}`);
        console.log(`Pet name: ${this.petName}`);
        console.log(`Pet age: ${this.petAge}`);

        if (this.petType.toLowerCase() === 'dog') {
            console.log(`Dog spaces: ${this.dogSpaces}`);
        } else if (this.petType.toLowerCase() === 'cat') {
            console.log(`Cat spaces: ${this.catSpaces}`);
        }

        console.log(`Days stay: ${this.daysStay}`);
        console.log(`Amount due: ${this.amountDue}`);
    }
}
