/**
 * @class User
 */
class User {
    constructor(userID, ip) {
        this.userID = userID;
        this.ip = ip;
        this.socket = null;
        this.currentRoom = null;
        this.timesPlayed = 0;
        this.totalScore = 0;
    }
    setStats(timesPlayed, totalScore) {
        this.timesPlayed = timesPlayed;
        this.totalScore = totalScore;
    }
}


module.exports = User