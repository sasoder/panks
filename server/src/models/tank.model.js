/**
 * @class Tank
 */
class Tank {
    constructor(userID, x, y, colour, name) {
        this.userID = userID
        this.x = x
        this.y = y
        this.shootAngle = 45
        this.fuel = 500
        this.shootPower = 60
        this.colour = colour
        this.score = 0
        this.name = name;
    }
}

module.exports = Tank