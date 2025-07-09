const { GraphQLScalarType, GraphQLError } = require('graphql');
const { Kind } = require('graphql/language');
const mongoose = require('mongoose');

const ObjectIdScalar = new GraphQLScalarType({
  name: 'ObjectId',
  description: 'MongoDB ObjectId scalar type',
  
  serialize(value) {
    // Called when sending data to client
    if (!value) return null;
    
    // If it's already a string, return it
    if (typeof value === 'string') {
      // Validate it's a valid ObjectId string
      if (mongoose.Types.ObjectId.isValid(value)) {
        return value;
      }
      throw new GraphQLError(`Invalid ObjectId string: ${value}`);
    }
    
    // If it's a MongoDB ObjectId, convert to string
    if (value instanceof mongoose.Types.ObjectId) {
      return value.toString();
    }
    
    // If it's an object with _id property, use that
    if (value && value._id) {
      if (value._id instanceof mongoose.Types.ObjectId) {
        return value._id.toString();
      }
      if (typeof value._id === 'string' && mongoose.Types.ObjectId.isValid(value._id)) {
        return value._id;
      }
    }
    
    // If it's an object with id property, use that
    if (value && value.id) {
      if (value.id instanceof mongoose.Types.ObjectId) {
        return value.id.toString();
      }
      if (typeof value.id === 'string' && mongoose.Types.ObjectId.isValid(value.id)) {
        return value.id;
      }
    }
    
    // Try to convert directly to ObjectId and then string
    try {
      const objectId = new mongoose.Types.ObjectId(value);
      return objectId.toString();
    } catch (error) {
      throw new GraphQLError(`Cannot serialize value as ObjectId: ${value}. Error: ${error.message}`);
    }
  },
  
  parseValue(value) {
    // Called when receiving data from client (variables)
    if (!value) return null;
    
    if (typeof value === 'string') {
      if (mongoose.Types.ObjectId.isValid(value)) {
        return new mongoose.Types.ObjectId(value);
      }
      throw new GraphQLError(`Invalid ObjectId string: ${value}`);
    }
    
    throw new GraphQLError(`Cannot parse value as ObjectId: ${value}`);
  },
  
  parseLiteral(ast) {
    // Called when receiving data from client (inline)
    if (ast.kind === Kind.STRING) {
      if (mongoose.Types.ObjectId.isValid(ast.value)) {
        return new mongoose.Types.ObjectId(ast.value);
      }
      throw new GraphQLError(`Invalid ObjectId string: ${ast.value}`);
    }
    
    throw new GraphQLError(`Cannot parse literal as ObjectId. Expected string, got: ${ast.kind}`);
  }
});

module.exports = ObjectIdScalar; 