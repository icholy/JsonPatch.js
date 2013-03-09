var JsonPointer = require('./jsonpointer.js'),
    helpers = require('./helpers.js'),
    _ = require('underscore');

var JsonPatch = function () {};

JsonPatch.prototype.remove = function (result) {
  var _this = this,
      parent = result.parent,
      accessor = result.accessor,
      val = result.val,
      type = _.isArray(result) ? 'array' : result.type;
  switch (type) {
    case 'property':
      delete parent[accessor];
      break;
    case 'index':
      delete parent[accessor];
      parent.splice(accessor, 1);
      break;
    case 'slice':
      if (val.length === 0) break;
      var start = accessor[0],
          end = accessor[1];
      helpers.spliceUtil(start, end, parent);
      break;
    case 'array':
      _.each(result, this.remove.bind(this));
      break;
    default:
      throw Error('unknown type: ' + type);
  }
};

JsonPatch.prototype.replace = function (result, value) {
  var _this = this,
      parent = result.parent,
      accessor = result.accessor,
      val = result.val,
      type = _.isArray(result) ? 'array' : result.type;
  switch (type) {
    case 'property':
      parent[accessor] = value;
      break;
    case 'index':
      parent[accessor] = value;
      break;
    case 'slice':
      if (val.length === 0) break;
      var start = accessor[0],
          end = accessor[1];
      helpers.spliceUtil(start, end, parent, value);
      break;
    case 'array':
      _.each(result, function (obj) { _this.replace(obj, value); });
      break;
    default:
      throw Error('unknown type: ' + type);
  }
};

JsonPatch.prototype.add = function (result, value) {
  var _this = this,
      parent = result.parent,
      accessor = result.accessor,
      val = result.val,
      type = _.isArray(result) ? 'array' : result.type;
  switch (type) {
    case 'property':
      parent[accessor] = value;
      break;
    case 'index':
      parent.splice(accessor, 0, value);
      break;
    case 'slice':
      this.replace(result, value);
      break;
    case 'array':
      _.each(result, function (obj) { _this.add(obj, value); });
      break;
    default:
      throw Error('unknown type: ' + type);
  }
};

JsonPatch.prototype.move = function (from, to) {
  var _this = this,
      type = _.isArray(from) ? 'array' : from.type;
  switch (type) {
    case 'property':
      this.add(to, from.val);
      this.remove(from);
      break;
    case 'index':
      this.add(to, from.val);
      this.remove(from);
      break;
    case 'slice':
      this.copy(from, to);
      this.remove(from);
      break;
    case 'array':
      this.copy(from, to);
      this.remove(from);
      break;
    default:
      throw Error('unknown type: ' + type);
  }
};

JsonPatch.prototype.copy = function (from, to) {
  var _this = this,
      type = _.isArray(from) ? 'array' : from.type;
  switch (type) {
    case 'property':
      this.add(to, from.val);
      break;
    case 'index':
      this.add(to, from.val);
    case 'slice':
      this.add(to, from.val);
      break;
    case 'array':
      this.add(to, _.map(from, function (obj) { return obj.val; }));
      break;
    default:
      throw Error('unknown type: ' + type);
  }
};

JsonPatch.prototype.applyPatch = function (json, patch) {
  switch (patch.op) {
    case 'add':
      var result = JsonPointer.apply(patch.path, json);
      this.add(result, patch.value);
      break;
    case 'remove':
      var result = JsonPointer.apply(patch.path, json);
      this.remove(result);
      break;
    case 'replace':
      var result = JsonPointer.apply(patch.path, json);
      this.replace(result, patch.value);
      break;
    case 'move':
      var resultFrom = JsonPointer.apply(patch.path, json),
          resultTo = JsonPointer.apply(patch.to, json);
      this.move(resultFrom, resultTo);
      break;
    case 'copy':
      var resultFrom = JsonPointer.apply(patch.path, json),
          resultTo = JsonPointer.apply(patch.to, json);
      this.copy(resultFrom, resultTo);
      break;
    default:
      throw Error('invalid op: ' + patch.op);
  }
};

JsonPatch.prototype.apply = function (json, patches) {
  var _this = this;
  _.each(patches, function (patch) {
    _this.applyPatch(json, patch);
  });
};

module.exports = JsonPatch;