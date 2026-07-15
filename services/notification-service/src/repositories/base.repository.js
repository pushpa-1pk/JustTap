class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id) {
    return this.model.findById(id).exec();
  }

  async findOne(filter) {
    return this.model.findOne(filter).exec();
  }

  async find(filter, options = { sort: { createdAt: -1 }, limit: 50, skip: 0 }) {
    return this.model.find(filter)
      .sort(options.sort)
      .limit(options.limit)
      .skip(options.skip)
      .exec();
  }

  async create(data) {
    return this.model.create(data);
  }

  async updateOne(filter, updateData, options = { new: true }) {
    return this.model.findOneAndUpdate(filter, updateData, options).exec();
  }

  async delete(filter) {
    return this.model.deleteMany(filter).exec();
  }
}

module.exports = BaseRepository;