class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'ServiceError';
  }
}

class ServiceResponse {
  constructor(status, data) {
    this.status = status;
    this.data = data;
  }
}

class InternalError extends Error {
  constructor(message) {
    super(message);
    this.message = message;
  }
}

module.exports = {
  ServiceError,
  ServiceResponse,
  InternalError,
};
