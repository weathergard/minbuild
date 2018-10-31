# MinBuild

Compile frontend javascript from separate files with ordinary get/set syntax. Code is wrapped with a light-touch, and is not otherwise altered; the output is readable and debug-friendly. Circularity is forbidden. 

Here's what it looks like:

```js
const foo = include.foo
const {bar, baz} = include.anotherThing

declare.myModule = function () {
	// ...
}
```

It's all just object property assignment and lookup. Compile a project as follows:

```shell
minbuild ./my-project
```

This creates a file at `./my-project/my-project.build.js`, containing the compiled output.
