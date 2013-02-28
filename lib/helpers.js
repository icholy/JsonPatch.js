var sliceUtil = function (start, end, arr) {
  if (isNaN(start) || !isFinite(start)) { start = 0;         }
  if (isNaN(end)   || !isFinite(end))   { end   = undefined; }
  return !!end ? arr.slice(start, end) : arr.slice(start);
};

var spliceUtil = function (start, end, arr) {
  if (isNaN(start) || !isFinite(start)) { start = 0;         }
  if (isNaN(end)   || !isFinite(end))   { end   = undefined; }
};

var isArray = function (obj) {
  return Object.prototype.toString.call(obj) === "[object Array]";
};

module.exports = { sliceUtil: sliceUtil, spliceUtil: spliceUtil, isArray: isArray };