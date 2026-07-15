const mongoose = require("mongoose");
const { logger } = require("../config/logger");

/**
 * Executes a functional operations block within an isolated ACID MongoDB multi-document transaction session.
 * @param {Function} operationsBlock Asynchronous execution logic mapping repository changes
 * @returns {Promise<any>} The computational block output payload
 */
const runInTransaction = async (operationsBlock) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await operationsBlock(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    logger.error("[TX-ROLLBACK] Transaction operation sequence failed. Changes reverted.", { error });
    throw error;
  } finally {
    await session.endSession();
  }
};

module.exports = { runInTransaction };