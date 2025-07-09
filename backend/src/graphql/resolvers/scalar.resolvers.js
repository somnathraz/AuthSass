const { GraphQLScalarType, GraphQLError } = require('graphql');
const { Kind } = require('graphql/language');
const mongoose = require('mongoose');

const scalarResolvers = {
  DateTime: new GraphQLScalarType({
    name: 'DateTime',
    description: 'Date and time as an ISO 8601 string',
    serialize(value) {
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (typeof value === 'string') {
        return new Date(value).toISOString();
      }
      throw new GraphQLError(`Value is not a valid DateTime: ${value}`);
    },
    parseValue(value) {
      if (typeof value === 'string') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new GraphQLError(`Value is not a valid DateTime: ${value}`);
        }
        return date;
      }
      throw new GraphQLError(`Value is not a valid DateTime: ${value}`);
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.STRING) {
        const date = new Date(ast.value);
        if (isNaN(date.getTime())) {
          throw new GraphQLError(`Value is not a valid DateTime: ${ast.value}`);
        }
        return date;
      }
      throw new GraphQLError(`Can only parse strings to DateTime but got a: ${ast.kind}`);
    }
  }),

  JSON: new GraphQLScalarType({
    name: 'JSON',
    description: 'JSON scalar type',
    serialize(value) {
      return value;
    },
    parseValue(value) {
      return value;
    },
    parseLiteral(ast) {
      switch (ast.kind) {
        case Kind.STRING:
          try {
            return JSON.parse(ast.value);
          } catch {
            return ast.value;
          }
        case Kind.OBJECT:
          return parseObjectLiteral(ast);
        case Kind.LIST:
          return ast.values.map(value => parseLiteral(value));
        case Kind.INT:
          return parseInt(ast.value, 10);
        case Kind.FLOAT:
          return parseFloat(ast.value);
        case Kind.BOOLEAN:
          return ast.value;
        case Kind.NULL:
          return null;
        default:
          throw new GraphQLError(`Unexpected kind in JSON scalar: ${ast.kind}`);
      }
    }
  }),

  EmailAddress: new GraphQLScalarType({
    name: 'EmailAddress',
    description: 'Email address scalar type',
    serialize(value) {
      if (typeof value !== 'string') {
        throw new GraphQLError(`Value is not a string: ${value}`);
      }
      
      if (!isValidEmail(value)) {
        throw new GraphQLError(`Value is not a valid email address: ${value}`);
      }
      
      return value.toLowerCase();
    },
    parseValue(value) {
      if (typeof value !== 'string') {
        throw new GraphQLError(`Value is not a string: ${value}`);
      }
      
      if (!isValidEmail(value)) {
        throw new GraphQLError(`Value is not a valid email address: ${value}`);
      }
      
      return value.toLowerCase();
    },
    parseLiteral(ast) {
      if (ast.kind !== Kind.STRING) {
        throw new GraphQLError(`Can only parse strings to EmailAddress but got a: ${ast.kind}`);
      }
      
      if (!isValidEmail(ast.value)) {
        throw new GraphQLError(`Value is not a valid email address: ${ast.value}`);
      }
      
      return ast.value.toLowerCase();
    }
  }),

  ObjectId: new GraphQLScalarType({
    name: 'ObjectId',
    description: 'MongoDB ObjectId scalar type',
    
    serialize(value) {
      // Called when sending data to client
      if (!value) return null;
      
      // If it's already a string, validate and return it
      if (typeof value === 'string') {
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
  })
};

// Helper function to parse object literals for JSON scalar
function parseObjectLiteral(ast) {
  const obj = {};
  ast.fields.forEach(field => {
    obj[field.name.value] = parseLiteral(field.value);
  });
  return obj;
}

// Helper function to parse any literal for JSON scalar
function parseLiteral(ast) {
  switch (ast.kind) {
    case Kind.STRING:
      return ast.value;
    case Kind.INT:
      return parseInt(ast.value, 10);
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.NULL:
      return null;
    case Kind.OBJECT:
      return parseObjectLiteral(ast);
    case Kind.LIST:
      return ast.values.map(value => parseLiteral(value));
    default:
      throw new GraphQLError(`Unexpected kind in JSON scalar: ${ast.kind}`);
  }
}

// Helper function to validate email addresses
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = scalarResolvers; 