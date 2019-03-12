// TODO: move these to a different file
class ServiceError extends Error {
  /**
   * @constructor
   * @param {number} status
   * @param {string} message
   */
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'ServiceError';
  }
}

class ServiceResponse {
  /**
   * @constructor
   * @param {number} status
   * @param {*} data
   */
  constructor(status, data) {
    this.status = status;
    this.data = data;
  }
}

class InternalError extends Error {
  /**
   * @constructor
   * @param {string} message
   */
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
