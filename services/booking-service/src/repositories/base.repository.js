const mongoose = require('mongoose');

class BaseRepository {
  /**
   * Binds a target Mongoose Model directly to the repository instance
   * @param {mongoose.Model} model - Native Mongoose Model reference
   */
  constructor(model) {
    if (!model) {
      throw new Error('Initialization aborted: Target database Model reference is undefined.');
    }
    this.model = model;
  }

  /**
   * Generates a clean soft-delete matching criteria block
   * @protected
   * @param {Object} [filter={}] - Target search criteria dictionary
   * @returns {Object} Hydrated criteria checking for un-deleted states
   */
  _buildFilter(filter = {}) {
    return {
      ...filter,
      $or: [
        { deletedAt: null },
        { deletedAt: { $exists: false } }
      ]
    };
  }

  /**
   * Persists a single new document collection record inside an active session context [cite: 183]
   * @param {Object} payload - Schema compliant data transfer object
   * @param {mongoose.ClientSession} [session=null] - Optional ACID transaction boundary pointer [cite: 183]
   * @returns {Promise<mongoose.Document>} Formatted Mongoose Document instance [cite: 204]
   */
  async create(payload, session = null) {
    const options = session ? { session } : {};
    const [doc] = await this.model.create([payload], options);
    return doc;
  }

  /**
   * Locates an entity strictly by its primary tracking ID using lean read-optimized execution [cite: 185]
   * @param {string} id - Target database ObjectId string
   * @param {Object} [projection=null] - Selective field dictionary filter map
   * @returns {Promise<Object|null>} Read-only dictionary snapshot or null [cite: 204]
   */
  async findById(id, projection = null) {
    return this.model.findOne(this._buildFilter({ _id: id }), projection).lean();
  }

  /**
   * Locates a single document using specialized runtime criteria query paths
   * @param {Object} filter - Search constraints filter dictionary
   * @param {Object} [projection=null] - Field projection selections mapping
   * @returns {Promise<Object|null>} Lean dictionary snapshot or null [cite: 204]
   */
  async findOne(filter, projection = null) {
    return this.model.findOne(this._buildFilter(filter), projection).lean();
  }

  /**
   * Retrieves all matching documents based on criteria configuration inputs
   * @param {Object} filter - Database matching boundaries
   * @param {Object} [projection=null] - Selected fields mask
   * @param {Object} [sort={ createdAt: -1 }] - Chronological sorting directives
   * @returns {Promise<Array<Object>>} Lean document dictionary array [cite: 204]
   */
  async find(filter, projection = null, sort = { createdAt: -1 }) {
    return this.model.find(this._buildFilter(filter), projection).sort(sort).lean();
  }

  /**
   * Modifies an existing data record using internal schema validation layers
   * @param {string} id - Target entity record database identifier
   * @param {Object} updateData - Key-value pair update mutation map
   * @param {mongoose.ClientSession} [session=null] - Optional transaction workspace session [cite: 183]
   * @returns {Promise<mongoose.Document|null>} Post-mutation Mongoose Document state [cite: 204]
   */
  async update(id, updateData, session = null) {
    const options = { new: true, runValidators: true };
    if (session) options.session = session;

    return this.model.findOneAndUpdate(
      this._buildFilter({ _id: id }),
      { $set: updateData },
      options
    );
  }

  /**
   * Executes heavy analytical pipelines using multi-stage framework aggregation chains
   * @param {Array<Object>} pipeline - Ordered collection metrics transformation commands
   * @param {mongoose.ClientSession} [session=null] - Optional transactional transaction boundary
   * @returns {Promise<Array<Object>>} Calculated analytics results array
   */
  async aggregate(pipeline, session = null) {
    const aggQuery = this.model.aggregate(pipeline);
    if (session) aggQuery.session(session);
    return aggQuery.exec();
  }

  /**
   * Verifies if any active documents match the specified criteria properties
   * @param {Object} filter - Constraint search fields dictionary
   * @returns {Promise<boolean>} True if matching documentation exists [cite: 204]
   */
  async exists(filter) {
    const match = await this.model.exists(this._buildFilter(filter));
    return !!match;
  }

  /**
   * Calculates the exact volumetric sizing metrics matching search definitions
   * @param {Object} filter - Constraint criteria mapping fields
   * @returns {Promise<number>} Evaluated numeric density count [cite: 204]
   */
  async count(filter) {
    return this.model.countDocuments(this._buildFilter(filter));
  }

  /**
   * Performs data discovery searches using cursor pagination mechanisms 
   * @param {Object} filter - Search criteria parameters block
   * @param {Object} options - Pagination configuration { page, limit, sort, populate, projection } [cite: 196]
   * @returns {Promise<Object>} API-ready pagination structure containing navigation variables
   */
  async findPaginated(filter, { page = 1, limit = 10, sort = { createdAt: -1 }, populate = '', projection = null } = {}) {
    const skip = (page - 1) * limit;
    const cleanFilter = this._buildFilter(filter);

    const query = this.model.find(cleanFilter, projection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(); // Enforce fast reporting optimization rules [cite: 185]

    if (populate) {
      query.populate(populate);
    }

    const [docs, totalDocs] = await Promise.all([
      query,
      this.model.countDocuments(cleanFilter)
    ]);

    const totalPages = Math.ceil(totalDocs / limit);

    return {
      docs,
      totalDocs,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };
  }

  /**
   * Logs deletion metadata onto a target entity rather than purging it from disk 
   * @param {string} id - Database tracking identifier
   * @param {Object} deletedBy - Session actor context tracking data { userId, role }
   * @param {mongoose.ClientSession} [session=null] - Active transaction state handler [cite: 183]
   * @returns {Promise<mongoose.Document|null>} Formatted Mongoose Document verification context [cite: 204]
   */
  async softDelete(id, deletedBy, session = null) {
    const options = { new: true };
    if (session) options.session = session;

    return this.model.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { 
        $set: { 
          deletedAt: new Date(),
          metadata: {
            purgedBy: deletedBy
          }
        } 
      },
      options
    );
  }
}

module.exports = BaseRepository;