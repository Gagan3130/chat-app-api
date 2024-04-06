class CustomError extends Error {
    constructor(type, { message, code }) {
      super(message);
      this.name = this.constructor.name;
      this.type = type;
      this.code = code || null;
    }
  }
  
  class ValidationError extends CustomError {
    constructor({ message, code }) {
      super("ValidationError", { message, code });
    }
  }
  
  class AuthenticationError extends CustomError {
    constructor({ message, code }) {
      super("AuthenticationError", { message, code });
    }
  }
  
  class NotFoundError extends CustomError {
    constructor({ message, code }) {
      super("NotFoundError", { message, code });
    }
  }
  
  module.exports = {
    ValidationError,
    AuthenticationError,
    NotFoundError,
  };
  