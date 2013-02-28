# JsonPatch (unless you enjoy pain, do not use this)

this is library loosely based on the [json-patch](http://tools.ietf.org/html/draft-ietf-appsawg-json-patch-05) draft. 

The one thing that this library has that the draft doesn't is slices.


**Original Data**

``` javascript
var someData = {
	foo: [
		{ x: 1 },
		{ y: 2 }
	] 
};
```

**Move slice contents**

``` javascript
var patcher = new JsonPatch();

patcher.apply(someData, [{ op: 'move', from: '/foo/0:2/x', to: '/bar' }] );
```

**Resulting Data**

``` javascript
var someData = {
	foo: [
		{},
		{}
	],
	bar: [1, 2]
};
```

cool eh? Splices can be used with the other operations too: 

* `add`
* `remove`
* `replace`
* `move`
* `copy`