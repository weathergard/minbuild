# MinBuild

Sometimes using tools like Webpack, Browserify, or whatever else, is sort of a bummer. Especially for smaller projects, or for code that you won't be keeping up with much (no one wants to fix a 4 year-old build configuation). Yet having the freedom to split frontend code into separate files is really nice. So here's a tool that's simple to the point of stupidity, which lets you create large structured codebases.

All of the module management is done via a single dependency object, accessed from the `include` and `declare` identifiers (declare these as globals in your linter).

```js
const foo = include.foo
const {bar, baz} = include.anotherThing

declare.myModule = function () {
	// ...
}
```

Don't use `declare` in your project's main file.

```shell
cd ~/myproject && minbuild
```

This will create a labelled, readable, debug-friendly output file called `myproject.compiled.js`.
