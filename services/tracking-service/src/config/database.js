const mongoose = require('mongoose');
const config = require('./env');
const logger = require('./logger');

const connectDatabase = async () => {
  try {
    // Dynamic production configuration gate to eliminate direct runtime index creation overhead
    const autoIndexEnabled = config.env !== 'production';

    await mongoose.connect(config.mongoUri, {
      autoIndex: autoIndexEnabled,
      maxPoolSize: 50,
      minPoolSize: 10
    });
    
    logger.info(`MongoDB connection layer anchored. Auto-indexing status: ${autoIndexEnabled}`);
  } catch (error) {
    logger.error('Critical exception initializing MongoDB pool during infrastructure boot sequence:', error);
    throw error;
  }
};

module.exports = { connectDatabase };