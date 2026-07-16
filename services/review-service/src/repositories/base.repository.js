class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(payload, options = {}) {
    const doc = new this.model(payload);
    return doc.save(options);
  }

  async findById(id) {
    return this.model.findById(id);
  }

  async findOne(query) {
    return this.model.findOne(query);
  }

  async updateOne(query, update, options = {}) {
    return this.model.updateOne(query, update, { new: true, runValidators: true, ...options });
  }
}

module.exports = BaseRepository;