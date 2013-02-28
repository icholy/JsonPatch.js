var jsonPatch = require('../lib/jsonpatch.js'),
		jsonPointer = require('../lib/jsonpointer.js'),
		helpers = require('../lib/helpers.js'),
		assert = require('chai').assert;

var patcher, A;

beforeEach(function () {
	patcher = new jsonPatch();
	A = {
		foo: "hello world",
		bar: [1, 2, 3, 4],
		baz: [
			{ x: "a" },
			{ x: "b" },
			{ x: "c" },
			{ x: "d" }
		],
		who: { what: { where: "why?" } }
	};
});


var c = function (p) {
	return jsonPointer.apply(p, A);
};

describe('jsonPointer', function () {
	describe('#apply', function () {

		it('should correctly get a value 1 level deep', function () {
			var result = c('/foo').val;
			assert.equal(result, "hello world");
		});

		it('should correctly get a value multiple levels deep', function () {
			var result = c('/who/what/where').val;
			assert.equal(result, "why?");
		});

		it('should work with array indices', function () {
			var result = c('/baz/0/x').val;
			assert.equal(result, "a");
		});

		it('should work with slices', function () {
			var result = c('/baz/0:1/x');
			assert.typeOf(result, "array");
			assert.lengthOf(result, 1);
			assert.equal(result[0].val, "a");
		});

		it('should have a index type for array elements', function () {
			var result = c('/baz/0');
			assert.equal(result.type, 'index');
		});

		it('should work with slices', function () {
			var result = c('/baz/0:1/x');
			assert.typeOf(result, "array");
			assert.lengthOf(result, 1);
			assert.equal(result[0].val, "a");
		});

		it('should have the parent and accessor', function () {
			var result = c('/foo');
			assert.property(result, 'parent');
			assert.property(result, 'accessor');
			assert.equal(result.parent[result.accessor], result.val);
		});

		it('should have a working accessor for arrays', function () {
			var result = c('/bar/1');
			assert.equal(result.parent[result.accessor], result.val);
		});
	});

});

describe('JsonPatch', function () {
	
	describe('#remove', function () {

		it('should remove a property', function () {
			var result = c('/foo');
			assert.property(A, 'foo');
			patcher.remove(result);
			assert.isUndefined(A.foo);
		});

		it('should remove an array index', function () {
			var result = c('/bar/0');
			assert.lengthOf(A.bar, 4);
			patcher.remove(result);
			assert.lengthOf(A.bar, 3);
		});

		it('should remove array slices', function () {
			var result = c('/bar/0:2');
			assert.lengthOf(A.bar, 4);
			patcher.remove(result);
			assert.lengthOf(A.bar, 2);
		});

		it('should remove properties in each of the slice elements', function () {
			var result = c('/baz/0:1/x');
			assert.property(A.baz[0], 'x');
			patcher.remove(result);
			assert.isUndefined(A.baz[0].x);
		});

	});

	describe('#replace', function () {
		it('should replace the property value', function () {
			var result = c('/foo');
			assert.equal(A.foo, "hello world");
			patcher.replace(result, "new value");
			assert.equal(A.foo, "new value");
		});

		it('should replace an array index value', function () {
			var result = c('/bar/1');
			assert.equal(A.bar[1], 2);
			patcher.replace(result, 100);
			assert.equal(A.bar[1], 100);
		});

		it('should replace the slice with a single value', function () {
			var result = c('/bar/0:2');
			assert.deepEqual(A.bar, [1, 2, 3, 4]);
			patcher.replace(result, ["hello"]);
			assert.deepEqual(A.bar, ["hello", 3, 4]);
		});

		it('should replce splice element contents', function () {
			var result = c('/baz/1:3/x');
			patcher.replace(result, "what");
			assert.equal(A.baz[1].x, "what");
			assert.equal(A.baz[2].x, "what");
		});

		it('should replace splice with 1 array element if it is [[]]', function () {
			var result = c('/baz/0:2');
			patcher.replace(result, [["a", "b", "c"]]);
			assert.lengthOf(A.baz, 3);
			assert.deepEqual(A.baz[0], ["a", "b", "c"]);
		});
	});

	describe('#add', function () {
		it('should add a value on a new key', function () {
			var result = c('/not_there');
			assert.isUndefined(A.not_there);
			patcher.add(result, "hi");
			assert.equal(A.not_there, "hi");
		});

		it('should add a value at an array index and shift the other values', function () {
			var result = c('/bar/0');
			assert.lengthOf(A.bar, 4);
			patcher.add(result, -1);
			assert.lengthOf(A.bar, 5);
			assert.equal(A.bar[0], -1);
		});
	});

	describe('#move', function () {
		it('should move a basic property', function () {
			var from = c('/foo'),
					to = c('/foo2');
			assert.isUndefined(A.foo2);
			assert.property(A, 'foo');
			patcher.move(from, to);
			assert.property(A, 'foo2');
			assert.isUndefined(A.foo);
		});

		it('should move a slice', function () {
			var from = c('/bar/0:3'),
					to = c('/boo');
			assert.isUndefined(A.boo);
			assert.lengthOf(A.bar, 4);
			patcher.move(from, to);
			assert.property(A, 'boo');
			assert.lengthOf(A.boo, 3);
			assert.lengthOf(A.bar, 1);
		});

		it('should move properties inside slices', function () {
			var from = c('/baz/0:4/x'),
				to = c('/xs');
			assert.isUndefined(A.xs);
			patcher.move(from, to);
			assert.property(A, 'xs');
			assert.typeOf(A.xs, "array");
			assert.lengthOf(A.xs, 4);
			assert.deepEqual(A.xs, ["a", "b", "c", "d"]);
			assert.isUndefined(A.baz[0].x);
		});
	});

	describe('#copy', function () {
		it('should copy a basic value', function () {
			var from = c('/foo'),
					to = c('/foo2');
			patcher.copy(from, to);
			assert.equal(A.foo, A.foo2);
		});

		it('should copy deeply nested properties', function () {
			var from = c('/who/what/where'),
					to = c('/here');
			patcher.copy(from, to);
			assert.equal(A.who.what.where, A.here);
		});

		it('should copy slices to a property', function () {
			var from = c('/bar/0:2'),
					to = c('/poo');
			patcher.copy(from, to);
			assert.typeOf(A.poo, "array");
			assert.deepEqual(A.poo, [1, 2]);
			assert.lengthOf(A.bar, 4);
		});

		it('should copy an array into a slice', function () {
			var from = c('/bar'),
					to = c('/baz/0:1');
			patcher.copy(from, to);
			assert.lengthOf(A.baz, 7);
		});

		it('should copy a slice into an array index', function () {
			var from = c('/bar/0:3'),
					to = c('/baz/0');
			patcher.copy(from, to);
			assert.lengthOf(A.baz, 5);
		});

		it('should copy a slice into a slice', function () {
			var from = c('/bar/1:3'),
					to = c('/baz/0:1)');
			patcher.copy(from, to);
			assert.lengthOf(A.baz, 5);
			assert.deepEqual(A.baz.slice(0, 2), [2, 3]);
		});
	});
});

describe('helpers', function () {
	describe('#sliceUtil', function () {
		it('should get the correct simple slice', function () {
			var arr = helpers.sliceUtil(0, 1, [1, 2, 3]);
			assert.deepEqual(arr, [1]);
		});

		it('should work without a start index', function () {
			var arr = helpers.sliceUtil(undefined, 2, [1, 2, 3, 4]);
			assert.deepEqual(arr, [1, 2]);
		});

		it('should work without an end index', function () {
			var arr = helpers.sliceUtil(-2, undefined, [1, 2, 3, 4]);
			assert.deepEqual(arr, [3, 4]);
		});

		it('should work with a negative end index', function () {
			var arr = helpers.sliceUtil(0, -1, [1, 2, 3, 4]);
			assert.deepEqual(arr, [1, 2, 3]);
		});

		it('should work with no start index and a negative end index', function () {
			var arr = helpers.sliceUtil(undefined, -2, [1, 2, 3, 4, 5]);
			assert.deepEqual(arr, [1, 2, 3]);
		});

		it('should return the whole array if there is no start or end', function () {
			var arr = helpers.sliceUtil(undefined, undefined, [1, 2, 3]);
			assert.deepEqual(arr, [1, 2, 3]);
		});
	});

	describe('#spliceUtil', function () {
		it('should get the correct simple slice', function () {
			var arr = helpers.spliceUtil(0, 1, [1, 2, 3]);
			assert.deepEqual(arr, [1]);
		});

		it('should work without a start index', function () {
			var arr = helpers.spliceUtil(undefined, 2, [1, 2, 3, 4]);
			assert.deepEqual(arr, [1, 2]);
		});

		it('should work without an end index', function () {
			var arr = helpers.spliceUtil(-2, undefined, [1, 2, 3, 4]);
			assert.deepEqual(arr, [3, 4]);
		});

		it('should work with a negative end index', function () {
			var arr = helpers.spliceUtil(0, -1, [1, 2, 3, 4]);
			assert.deepEqual(arr, [1, 2, 3]);
		});

		it('should work with no start index and a negative end index', function () {
			var arr = helpers.spliceUtil(undefined, -2, [1, 2, 3, 4, 5]);
			assert.deepEqual(arr, [1, 2, 3]);
		});

		it('should return the whole array if there is no start or end', function () {
			var arr = helpers.spliceUtil(undefined, undefined, [1, 2, 3]);
			assert.deepEqual(arr, [1, 2, 3]);
		});

		it('should return an empty array when called with 0,0', function () {
			var arr = helpers.spliceUtil(0,0,[1, 2, 3]);
			assert.lengthOf(arr, 0);
		});

		it('should splice in the 4th parameter', function () {
			var arr = [1, 2, 3, 4, 5];
			helpers.spliceUtil(0, 1, arr, "hi");
			assert.equal(arr[0], "hi");
		});

		it('should splice in an array of values', function () {
			var arr = [1, 2, 3, 4, 5];
			helpers.spliceUtil(0, 4, arr, ["this", "is", "a", "test"]);
			assert.deepEqual(arr, ["this", "is", "a", "test", 5]);
		})
	});
});