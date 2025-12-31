// Global BigInt serialization fix
BigInt.prototype.toJSON = function() {
  return this.toString();
};

module.exports = {};