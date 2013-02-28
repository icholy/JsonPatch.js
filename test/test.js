var jsonPatch = require('../lib/index.js'),
	assert = require('chai').assert;

describe('JsonPatch', function () {

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
		return patcher.compilePointerWithMeta(p)(A);
	};

	describe('#compilePointer', function () {

		it('should correctly get a value 1 level deep', function () {
			var cmp = patcher.compilePointer('/foo'),
				result = cmp(A);
			assert.equal(result, "hello world");
		});

		it('should correctly get a value multiple levels deep', function () {
			var cmp = patcher.compilePointer('/who/what/where'),
				result = cmp(A);
			assert.equal(result, "why?");
		});

		it('should work with array indices', function () {
			var cmp = patcher.compilePointer('/baz/0/x'),
				result = cmp(A);
			assert.equal(result, "a");
		});

		it('should work with slices', function () {
			var cmp = patcher.compilePointer('/baz/0:1/x'),
				result = cmp(A);
			assert.typeOf(result, "array");
			assert.lengthOf(result, 1);
			assert.equal(result[0], "a");
		});
	});

	describe('#compilePointerWithMeta', function () {

		it('should correctly get a value 1 level deep', function () {
			var cmp = patcher.compilePointerWithMeta('/foo'),
				result = cmp(A).val;
			assert.equal(result, "hello world");
		});

		it('should correctly get a value multiple levels deep', function () {
			var cmp = patcher.compilePointerWithMeta('/who/what/where'),
				result = cmp(A).val;
			assert.equal(result, "why?");
		});

		it('should work with array indices', function () {
			var cmp = patcher.compilePointerWithMeta('/baz/0/x'),
				result = cmp(A).val;
			assert.equal(result, "a");
		});

		it('should have a index type for array elements', function () {
			var cmp = patcher.compilePointerWithMeta('/baz/0'),
				result = cmp(A);
			assert.equal(result.type, 'index');
		});

		it('should work with slices', function () {
			var cmp = patcher.compilePointerWithMeta('/baz/0:1/x'),
				result = cmp(A).val;
			assert.typeOf(result, "array");
			assert.lengthOf(result, 1);
			assert.equal(result[0].val, "a");
		});

		it('should have the parent and accessor', function () {
			var cmp = patcher.compilePointerWithMeta('/foo'),
				result = cmp(A);
			assert.property(result, 'parent');
			assert.property(result, 'accessor');
			assert.equal(result.parent[result.accessor], result.val);
		});

		it('should have a working accessor for arrays', function () {
			var cmp = patcher.compilePointerWithMeta('/bar/1'),
				result = cmp(A);
			assert.equal(result.parent[result.accessor], result.val);
		});
	});

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
			patcher.replace(result, "hello");
			assert.deepEqual(A.bar, ["hello", 3, 4]);
		});

		it('should replce splice element contents', function () {
			var result = c('/baz/1:3/x');
			patcher.replace(result, "what");
			assert.equal(A.baz[1].x, "what");
			assert.equal(A.baz[2].x, "what");
		});
	});

	describe('#add', function () {
		it('should add a value on a new key', function () {
			var result = c('/not_there');
			assert.isUndefined(A.not_there);
			patcher.add(result, "hi");
			assert.equal(A.not_there, "hi");
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
		})
	});
});