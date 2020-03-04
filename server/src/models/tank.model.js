/**
 * @class Tank
 */
class Tank {

    // TODO: Remove this or make use of it in order to send game state? (tanks[])
    
    constructor(userID, x, y, colour) {
        // Also used as name for tank
        this.userID = userID
        this.x = x
        this.y = y
        this.shootAngle = 45
        this.fuel = 500
        this.shootPower = 60
        this.colour = colour
        this.score = 0
    }
}

module.exports = Tank