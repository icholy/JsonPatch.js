# JsonPatch with Slices (this is an experiment)

This is library loosely based on the [json-patch](http://tools.ietf.org/html/draft-ietf-appsawg-json-patch-05) draft.

The project was motivated by an [earlier rant](https://gist.github.com/icholy/5050533)

**Original Data**

``` javascript

var JsonPatch = require('jsonpatch'),
    patcher = new JsonPatch();

var someData = {
	foo: [
		{ x: 1 },
		{ y: 2 }
	]
};
```

**Remove slice**

``` javascript
patcher.apply(someData, [{ op: 'remove', path: '/foo/0:2'}] );

// resulting object
{
  foo: [],
}
```

**Move slice contents**

``` javascript
patcher.apply(someData, [{ op: 'move', path: '/foo/0:2/x', to: '/bar' }] );

// resulting object
{
  foo: [
    {},
    {}
  ],
  bar: [1, 2]
}
```
cool eh? Splices can be used with the other operations too: 

* `add`
* `remove`
* `replace`
* `move`
* `copy`

See more examples in the [tests](https://github.com/icholy/JsonPatch.js/blob/master/test/example.js)

