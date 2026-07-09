const { AsyncLocalStorage } = require("node:async_hooks");

class RequestContextService {
  constructor() {
    this.asyncLocalStorage = new AsyncLocalStorage();
  }

  run(context, callback) {
    return this.asyncLocalStorage.run(context, callback);
  }

  getContext() {
    return this.asyncLocalStorage.getStore() || {};
  }
}

module.exports = new RequestContextService();
