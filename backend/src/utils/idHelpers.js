const mongoose = require('mongoose');

/**
 * Converts various ID formats to a string suitable for GraphQL ID fields
 * @param {*} value - The value to convert (ObjectId, string, object with _id, etc.)
 * @returns {string|null} - String representation of the ID or null
 */
function toGraphQLId(value) {
  if (!value) return null;
  
  // If it's already a string, validate and return it
  if (typeof value === 'string') {
    if (mongoose.Types.ObjectId.isValid(value)) {
      return value;
    }
    return value; // Return as-is if not a valid ObjectId string (might be a different ID format)
  }
  
  // If it's a MongoDB ObjectId, convert to string
  if (value instanceof mongoose.Types.ObjectId) {
    return value.toString();
  }
  
  // If it's an object with _id property, use that
  if (value && value._id) {
    return toGraphQLId(value._id);
  }
  
  // If it's an object with id property, use that
  if (value && value.id) {
    return toGraphQLId(value.id);
  }
  
  // Try to convert to string as last resort
  try {
    return value.toString();
  } catch (error) {
    console.warn(`Could not convert value to GraphQL ID: ${value}`, error);
    return null;
  }
}

/**
 * Converts a GraphQL ID string to a MongoDB ObjectId
 * @param {string} id - The ID string to convert
 * @returns {mongoose.Types.ObjectId|null} - MongoDB ObjectId or null
 */
function toMongoId(id) {
  if (!id) return null;
  
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  
  if (id instanceof mongoose.Types.ObjectId) {
    return id;
  }
  
  return null;
}

/**
 * Safely converts an object's ID fields to GraphQL-safe strings
 * @param {Object} obj - The object to process
 * @param {string[]} idFields - Array of field names that contain IDs (default: ['id', '_id', 'organizationId', 'userId', 'appId'])
 * @returns {Object} - The object with converted ID fields
 */
function sanitizeObjectIds(obj, idFields = ['id', '_id', 'organizationId', 'userId', 'appId']) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = { ...obj };
  
  // Convert _id to id if present
  if (sanitized._id) {
    sanitized.id = toGraphQLId(sanitized._id);
    delete sanitized._id;
  }
  
  // Convert specified ID fields
  idFields.forEach(field => {
    if (sanitized.hasOwnProperty(field)) {
      // Handle the case where the field exists but might be null/undefined
      if (sanitized[field] !== null && sanitized[field] !== undefined) {
        const convertedId = toGraphQLId(sanitized[field]);
        if (convertedId !== null) {
          sanitized[field] = convertedId;
        } else {
          // If conversion failed, keep the original value or set to 'unknown' for required fields
          console.warn(`Failed to convert ${field} to GraphQL ID:`, sanitized[field]);
          if (field === 'organizationId') {
            sanitized[field] = 'unknown';
          }
        }
      } else {
        // Field exists but is null/undefined - handle required fields
        if (field === 'organizationId') {
          console.warn(`${field} is null/undefined, setting to 'unknown'`);
          sanitized[field] = 'unknown';
        }
      }
    }
  });
  
  return sanitized;
}

/**
 * Safely converts an array of objects' ID fields to GraphQL-safe strings
 * @param {Array} array - The array of objects to process
 * @param {string[]} idFields - Array of field names that contain IDs
 * @returns {Array} - The array with converted ID fields
 */
function sanitizeArrayIds(array, idFields = ['id', '_id', 'organizationId', 'userId', 'appId']) {
  if (!Array.isArray(array)) return array;
  
  return array.map(item => sanitizeObjectIds(item, idFields));
}

module.exports = {
  toGraphQLId,
  toMongoId,
  sanitizeObjectIds,
  sanitizeArrayIds
}; 