const ApiError = require("../utils/ApiError");

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data, session = null) {
    const docs = await this.model.create([data], { session });
    return docs[0];
  }

  async findById(id, session = null) {
    return this.model.findById(id).session(session);
  }

  async findOne(filter, session = null) {
    return this.model.findOne(filter).session(session);
  }

  async find(filter = {}, options = {}, session = null) {
    const { limit = 10, skip = 0, sort = { createdAt: -1 } } = options;
    return this.model.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .session(session);
  }

  async update(id, updateData, session = null) {
    const result = await this.model.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
      session
    });
    if (!result) throw new ApiError(404, "Target resource entity not found for mutation");
    return result;
  }
}

module.exports = BaseRepository;