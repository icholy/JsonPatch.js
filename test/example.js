var assert = require('chai').assert,
    JsonPatch = require('../lib/jsonpatch.js');

describe('JsonPatch', function () {

  describe('#apply', function () {

    var patcher, data;

    beforeEach(function () {
      patcher = new JsonPatch();
      data = {
        who: { what: { where: "here" } },
        bar: [1, 2, 3, 4, 5],
        baz: [
          { x: true,  y: "a" },
          { x: false, y: "b" },
          { x: true,  y: "c" },
          { x: true,  y: "d" },
          { x: false, y: "e" }
        ]
      };
    });

    describe('add', function () {
      it('should add basic property', function () {
        patcher.apply(data, [{ op: 'add', path: '/boo', value: "this is a test" }]);
        assert.property(data, 'boo');
        assert.equal(data.boo, "this is a test");
      });

      it('should add arrays', function () {
        patcher.apply(data, [{ op: 'add', path: '/boo', value: [1, 2, 3] }]);
        assert.property(data, 'boo');
        assert.deepEqual(data.boo, [1, 2, 3]);
      });

      it('should add properties to slices', function () {
        patcher.apply(data, [{ op: 'add', path: '/baz/0:5/z', value: "z-value" }]);
        data.baz.forEach(function (obj) { assert.equal(obj.z, "z-value"); });
      });
    });

    describe('replace', function () {

      it('should replace basic properties', function () {
        patcher.apply(data, [{ op: 'replace', path: '/who/what/where', value: "new_value" }]);
        assert.equal(data.who.what.where, "new_value");
      });

      it('should replace array indexes', function () {
        patcher.apply(data, [{ op: 'replace', path: '/baz/0', value: "this is new" }]);
        assert.equal(data.baz[0], "this is new");
      });

      it("should replace properties in slices", function () {
        patcher.apply(data, [{ op: 'replace', path: '/baz/0:2/x', value: "hello" }]);
        assert.equal(data.baz[0].x, "hello");
        assert.equal(data.baz[1].x, "hello");
      });

      it('should replace slices with a single value', function () {
        patcher.apply(data, [{ op: 'replace', path: '/bar/0:3', value: 123 }]);
        assert.lengthOf(data.bar, 3);
        assert.deepEqual(data.bar, [123, 4, 5]);
      });

      it('should replace slices with arrays', function () {
        patcher.apply(data, [{ op: 'replace', path: '/bar/1:3', value: ["A", "B", "C"] }]);
        assert.lengthOf(data.bar, 6);
        assert.deepEqual(data.bar, [1, 'A', 'B', 'C', 4, 5]);
      });
    });

    describe('remove', function () {

      it('should remove a property', function () {
        patcher.apply(data, [{ op: 'remove', path: '/who' }]);
        assert.isUndefined(data.who);
      });

      it('should remove deeper properties', function () {
        patcher.apply(data, [{ op: 'remove', path: '/who/what/where' }]);
        assert.isUndefined(data.who.what.where);
      });

      it('should remove array indexes', function () {
        patcher.apply(data, [{ op: 'remove', path: '/baz/0' }]);
        assert.lengthOf(data.baz, 4);
        assert.deepEqual(data.baz[0], { x: false, y: "b" });
      });

      it('should remove properties in slices', function () {
        patcher.apply(data, [{ op: 'remove', path: '/baz/1:3/x' }]);
        assert.isUndefined(data.baz[1].x);
        assert.isUndefined(data.baz[2].x);
      });

      it('should remove slices', function () {
        patcher.apply(data, [{ op: 'remove', path: '/baz/2:4' }]);
        assert.lengthOf(data.baz, 3);
      });
    });

    describe('move', function () {

      it('should move basic properties', function () {
        patcher.apply(data, [{ op: 'move', path: '/who/what/where', to: '/who/what/when' }]);
        assert.equal(data.who.what.when, "here");
        assert.isUndefined(data.who.what.where);
      });

      it('should move objects', function () {
        patcher.apply(data, [{ op: 'move', path: '/who', to: '/poo' }]);
        assert.isUndefined(data.who);
        assert.equal(data.poo.what.where, "here");
      });

      it('should move slices', function () {
        patcher.apply(data, [{ op: 'move', path: '/bar/0:2', to: '/poo' }]);
        assert.lengthOf(data.bar, 3);
        assert.lengthOf(data.poo, 2);
        assert.deepEqual(data.poo, [1, 2]);
      });
    });

    describe('copy', function () {

    });

  })
});