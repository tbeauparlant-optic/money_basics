(function (global) {
  "use strict";

  var apiHandle = null;
  var initialized = false;
  var finished = false;
  var MAX_TRIES = 500;

  function findApi(win) {
    var current = win;
    var tries = 0;

    while (current && tries < MAX_TRIES) {
      if (current.API) {
        return current.API;
      }

      if (current === current.parent) {
        break;
      }

      tries += 1;
      current = current.parent;
    }

    return null;
  }

  function getApi() {
    if (apiHandle) {
      return apiHandle;
    }

    apiHandle = findApi(global);

    if (!apiHandle && global.opener) {
      apiHandle = findApi(global.opener);
    }

    return apiHandle;
  }

  function init() {
    if (initialized) {
      return true;
    }

    var api = getApi();
    if (!api) {
      return false;
    }

    var result = api.LMSInitialize("");
    initialized = String(result).toLowerCase() === "true";
    return initialized;
  }

  function getValue(element) {
    var api = getApi();

    if (!api || !initialized) {
      return "";
    }

    var value = api.LMSGetValue(element);
    return typeof value === "string" ? value : "";
  }

  function setValue(element, value) {
    var api = getApi();

    if (!api || !initialized) {
      return false;
    }

    var result = api.LMSSetValue(element, String(value));
    return String(result).toLowerCase() === "true";
  }

  function commit() {
    var api = getApi();

    if (!api || !initialized) {
      return false;
    }

    var result = api.LMSCommit("");
    return String(result).toLowerCase() === "true";
  }

  function finish() {
    var api = getApi();

    if (!api || !initialized || finished) {
      return false;
    }

    var result = api.LMSFinish("");
    finished = String(result).toLowerCase() === "true";
    return finished;
  }

  global.Scorm12 = {
    init: init,
    get: getValue,
    set: setValue,
    commit: commit,
    finish: finish
  };
})(window);
