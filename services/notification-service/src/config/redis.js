const Redis = require('ioredis');
const logger = require('./logger');

const redis = new Redis(process.env.REDIS_URI || 'redis://localhost:6379/0', {
  maxRetriesPerRequest: null,
  enableReadyCheck: true
});

redis.on('connect', () => logger.info('⚡ Redis connection active.'));
redis.on('error', (err) => logger.error('❌ Redis error:', err));

module.exports = redis;