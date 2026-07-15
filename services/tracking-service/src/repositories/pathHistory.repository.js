const PathHistory = require('../models/PathHistory.model');
const polylineUtil = require('../utils/polyline.util');
const logger = require('../config/logger');

class PathHistoryRepository {
  /**
   * Compresses a series of raw coordinate points into a single, space-optimized document record
   * @param {string} bookingId 
   * @param {string} providerId 
   * @param {Array<Object>} rawCoordinates Array of structural payload components { latitude, longitude }
   * @param {number} totalDistanceMeters 
   */
  async persistCompressedTrail(bookingId, providerId, rawCoordinates, totalDistanceMeters) {
    if (!rawCoordinates || rawCoordinates.length === 0) return null;

    try {
      let minLat = Number.MAX_VALUE, maxLat = -Number.MAX_VALUE;
      let minLon = Number.MAX_VALUE, maxLon = -Number.MAX_VALUE;

      // Extract coordinates array formatting structure and calculate the bounding box limits
      const coordinatePairs = rawCoordinates.map(point => {
        const lat = point.latitude;
        const lon = point.longitude;

        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;

        return [lat, lon];
      });

      // Compress all positions down into a single compact ASCII text block
      const compressedString = polylineUtil.encode(coordinatePairs);

      return await PathHistory.create({
        bookingId,
        providerId,
        encodedPath: compressedString,
        totalDistanceMeters,
        totalPointsCollected: rawCoordinates.length,
        boundingBox: {
          minLatitude: minLat,
          maxLatitude: maxLat,
          minLongitude: minLon,
          maxLongitude: maxLon
        }
      });
    } catch (error) {
      logger.error('Failed to write path history record document to MongoDB store:', { bookingId, error: error.message });
      throw error;
    }
  }

  async findPathByBookingId(bookingId) {
    return PathHistory.findOne({ bookingId }).lean();
  }
}

module.exports = new PathHistoryRepository();