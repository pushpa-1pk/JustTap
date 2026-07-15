/**
 * Structural input payload character defense tools to mitigate XSS injections into rendering frames
 */
class Sanitizer {
  static sanitizeText(inputString) {
    if (typeof inputString !== 'string') return inputString;
    return inputString
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  static sanitizeObject(targetObject) {
    if (!targetObject || typeof targetObject !== 'object') return targetObject;
    
    const cloned = Array.isArray(targetObject) ? [...targetObject] : { ...targetObject };
    for (const key in cloned) {
      if (typeof cloned[key] === 'string') {
        cloned[key] = this.sanitizeText(cloned[key]);
      } else if (typeof cloned[key] === 'object') {
        cloned[key] = this.sanitizeObject(cloned[key]);
      }
    }
    return cloned;
  }
}

module.exports = Sanitizer;