
var sliceUtil = function (start, end, arr) {
  if (isNaN(start) || !isFinite(start)) { start = 0;         }
  if (isNaN(end)   || !isFinite(end))   { end   = undefined; }
  return !!end ? arr.slice(start, end) : arr.slice(start);
};

var spliceUtil = function (start, end, arr, params) {
  var len = arr.length;
  if (isNaN(start) || !isFinite(start)) { start = 0;   }
  if (isNaN(end)   || !isFinite(end))   { end   = len; }
  start = start < 0 ? len + start : start;
  end = (end < 0 ? len + end : end) - start;
  return arr.splice.apply(arr, [start, end].concat(params || []));
};

module.exports = { sliceUtil: sliceUtil, spliceUtil: spliceUtil };