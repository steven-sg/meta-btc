class InvalidInputError extends Error {
  /**
   *
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'InvalidInputError';
    this.message = message;
  }
}

module.exports = {
  InvalidInputError,
};
