class BaseRepository {

    constructor(model) {
        this.model = model;
    }

    async create(data) {
        return this.model.create(data);
    }

    async findById(id) {
        return this.model.findById(id);
    }

    async findOne(filter) {
        return this.model.findOne(filter);
    }

    async find(filter = {}) {
        return this.model.find(filter);
    }

    async updateById(id, updateData) {
        return this.model.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,
                runValidators: true,
            }
        );
    }

    async deleteById(id) {
        return this.model.findByIdAndDelete(id);
    }

    async exists(filter) {
        return this.model.exists(filter);
    }

    async count(filter = {}) {
        return this.model.countDocuments(filter);
    }
}

module.exports = BaseRepository;