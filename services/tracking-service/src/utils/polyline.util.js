class PolylineUtil {
  /**
   * Compresses an array of coordinate frames into a compact Google Encoded Polyline string
   * @param {Array<Array<number>>} coordinatePairs Array of [[lat, lon], [lat, lon], ...]
   * @returns {string} Encoded ASCII polyline string payload
   */
  encode(coordinatePairs) {
    if (!coordinatePairs || coordinatePairs.length === 0) return '';

    let result = '';
    let previousLatitude = 0;
    let previousLongitude = 0;

    for (const point of coordinatePairs) {
      // Scale to 5 decimal places of accuracy (approx 1 meter precision margin)
      const currentLatitude = Math.round(point[0] * 1e5);
      const currentLongitude = Math.round(point[1] * 1e5);

      const deltaLatitude = currentLatitude - previousLatitude;
      const deltaLongitude = currentLongitude - previousLongitude;

      previousLatitude = currentLatitude;
      previousLongitude = currentLongitude;

      result += this._encodeSignedValue(deltaLatitude);
      result += this._encodeSignedValue(deltaLongitude);
    }

    return result;
  }

  _encodeSignedValue(value) {
    // Left-shift value by 1 bit, and invert if the original number is negative
    let signedValue = value << 1;
    if (value < 0) {
      signedValue = ~signedValue;
    }
    return this._encodeUnsignedValue(signedValue);
  }

  _encodeUnsignedValue(value) {
    let result = '';
    while (value >= 0x20) {
      // Mask 5 bits, bitwise OR with 0x20 to signal continuation, and add 63 to map to an ASCII character
      result += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
      value >>= 5;
    }
    result += String.fromCharCode(value + 63);
    return result;
  }
}

module.exports = new PolylineUtil();