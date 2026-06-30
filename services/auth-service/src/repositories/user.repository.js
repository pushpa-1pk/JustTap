const BaseRepository = require("./base.repository");
const User = require("../models/User");

class UserRepository extends BaseRepository {
    constructor() {
        super(User);
    }

    async findByPhone(phone) {
        return this.findOne({ phone });
    }

    async findByEmail(email) {
        return this.findOne({ email });
    }

    async incrementTokenVersion(userId) {
        return this.updateById(userId, {
            $inc: { tokenVersion: 1 },
        });
    }

    async updateLastLogin(userId) {
        return this.updateById(userId, {
            lastLoginAt: new Date(),
        });
    }
}

module.exports = new UserRepository();