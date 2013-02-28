var JsonPatch = function () {};

var isArray = function (obj) {
  return Object.prototype.toString.call(obj) === "[object Array]";
};

JsonPatch.prototype.compilePointer = function () {

  var invokeCallback = function (val, parent, accessor, type, cb, isLastPart) {
    return isLastPart
      ? cb({ val: val, parent: parent, accessor: accessor, type: type })
      : cb(val);
  }

  var compilePart = function (part, idx, parts) {  
    var colIndex = part.indexOf(':'),
        isLastPart = (idx === parts.length - 1);
    if (colIndex === -1) {
      return function (obj, cb) {
        var type = isArray(obj) ? 'index' : 'property';
        return invokeCallback(obj[part], obj, part, type, cb, isLastPart);
      };
    } else {
      var splitStart = parseInt(part.substr(0, colIndex), 10),
          splitEnd   = parseInt(part.substr(colIndex + 1), 10);
      return function (arr, cb) {
        if (isLastPart) {
          return {
            val: arr.slice(splitStart, splitEnd),
            parent: arr,
            type: 'slice',
            accessor: [splitStart, splitEnd]
          };
        } else {
          return arr.slice(splitStart, splitEnd).map(function (obj, idx) {
            return invokeCallback(obj, arr, idx, 'index', cb, isLastPart);
          });
        }
      };
    }
  };
 
  var composeParts = function (acc, step) {
    return function (obj) { return step(obj.val || obj, acc); };
  };
 
  var filterPart = function (part) { return part.length > 0; };
  
  var done = function (obj) { return obj; };
 
  return function (pointer) {
    return pointer.split('/')
      .filter(filterPart)
      .map(compilePart)
      .reverse()
      .reduce(composeParts, done);
  };
 
}.call(this);

JsonPatch.prototype.remove = function (result) {
  var _this = this,
      parent = result.parent,
      accessor = result.accessor,
      val = result.val,
      type = isArray(result) ? 'array' : result.type;

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
          len = accessor[1] - start;
      parent.splice(start, len);
      break;
    case 'array':
      result.forEach(this.remove.bind(this));
      break;
    default:
      throw Error('unknown type');
  }
};

JsonPatch.prototype.replace = function (result, value) {
  var _this = this,
      parent = result.parent,
      accessor = result.accessor,
      val = result.val;
  switch (result.type) {
    case 'property':
      parent[accessor] = value;
      break;
    case 'index':
      parent[accessor] = value;
      break;
    case 'slice':
      if (val.length === 0) break;
      if (!isArray(value)) {
        val.forEach(function (obj) { _this.replace(obj, value); });
      } else {
        var start = accessor[0],
            len = accessor[1] - start,
            params = [start, len].concat(value);
        parent.splice.apply(parent, params);
      }
      break;
    default:
      throw 'unknown type';
  }
};

JsonPatch.prototype.add = function (result, value) {
  var _this = this,
      parent = result.parent,
      accessor = result.accessor,
      val = result.val;
  switch (result.type) {
    case 'property':
      parent[accessor] = value;
      break;
    case 'index':
      parent[accessor] = value;
      break;
    case 'slice':
      if (val.length === 0) break;
      if (val[0].accessor !== undefined) {
        val.forEach(function (obj) {
          _this.add(obj, value);
        });
      } else {
        throw 'cannot add to slice';
      }
      break;
    default:
      throw 'unknown type';
  }
};

JsonPatch.prototype.move = function (from, to) {
  var _this = this;
  switch (from.type) {
    case 'property':
      this.add(to, from.val);
      this.remove(from);
      break;
    case 'index':
      this.add(to, from.val);
      this.remove(from);
    case 'slice':
      if (from.val.length === 0) {
        this.add(to, []);
      } else if (from.val[0].accessor !== undefined) {
        this.add(to, from.val.map(function (obj) { return obj.val; }));
      } else {
        this.add(to, from.val);
      }
      this.remove(from);
      break;
  }
};

JsonPatch.prototype.copy = function (from, to) {
  var _this = this;
  switch (from.type) {
    case 'property':
      this.add(to, from.val);
      break;
    case 'index':
      this.add(to, from.val);
    case 'slice':
      if (from.val.length === 0) {
        this.add(to, []);
      } else if (from.val[0].accessor !== undefined) {
        this.add(to, from.val.map(function (obj) { return obj.val; }));
      } else {
        this.add(to, from.val);
      }
      break;
  }
};

JsonPatch.prototype.applyPatch = function (json, patch) {
  switch (patch.op) {
    case 'add':
      var cmp = this.compilePointerWithMeta(patch.path),
          result = cmp(json);
      this.add(result, patch.value);
      break;
    case 'remove':
      var cmp = this.compilePointerWithMeta(patch.path),
          result = cmp(json);
      this.remove(result);
      break;
    case 'replace':
      var cmp = this.compilePointerWithMeta(patch.path),
          result = cmp(json);
      this.replace(result, patch.value);
      break;
    case 'move':
      var cmpFrom = this.compilePointerWithMeta(patch.from),
          cmpTo = this.compilePointerWithMeta(patch.to),
          resultFrom = cmpFrom(json),
          resultTo = cmpTo(json);
      this.move(resultFrom, resultTo);
      break;
    case 'copy':
      var cmpFrom = this.compilePointerWithMeta(patch.from),
          cmpTo = this.compilePointerWithMeta(patch.to),
          resultFrom = cmpFrom(json),
          resultTo = cmpTo(json);
      this.copy(resultFrom, resultTo);
      break;
    default:
      throw 'invalid op';
  }
};

JsonPatch.prototype.apply = function (json, patches) {
  var _this = this;
  patches.forEach(function (patch) {
    _this.applyPatch(json, patch);
  });
};

module.exports = JsonPatch;