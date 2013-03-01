
var helpers = require('./helpers.js'),
    _ = require('underscore');

var invokeCallback = function (val, parent, accessor, type, cb, isLastPart) {
  return isLastPart
    ? cb({ val: val, parent: parent, accessor: accessor, type: type })
    : cb(val);
};

var compilePart = function (part, idx, parts) {
  var colIndex = part.indexOf(':'),
      isLastPart = (idx === parts.length - 1);
  if (colIndex === -1) {
    return function (obj, cb) {
      var type = _.isArray(obj) ? 'index' : 'property';
      return invokeCallback(obj[part], obj, part, type, cb, isLastPart);
    };
  } else {
    var splitStart = parseInt(part.substr(0, colIndex), 10),
        splitEnd   = parseInt(part.substr(colIndex + 1), 10);
    return function (arr, cb) {
      if (isLastPart) {
        return {
          val: helpers.sliceUtil(splitStart, splitEnd, arr),
          parent: arr,
          type: 'slice',
          accessor: [splitStart, splitEnd]
        };
      } else {
        return _(helpers.sliceUtil(splitStart, splitEnd, arr)).map(function (obj, idx) {
          return invokeCallback(obj, arr, idx, 'index', cb, isLastPart);
        });
      }
    };
  }
};

var composeParts = function (acc, step) {
  return function (obj) {
    return step(obj.val || obj, acc);
  };
};

var filterPart = function (part) {
  return part.length > 0;
};

var done = function (obj) {
  return obj;
};

var compile = function (pointer) {
  return _.chain(pointer.split('/'))
    .filter(filterPart)
    .map(compilePart)
    .reverse()
    .reduce(composeParts, done)
    .value();
};

var apply = function (pointer, obj) {
  var cmp = compile(pointer);
  return cmp(obj);
};

module.exports = { compile: compile, apply: apply };