# MinBuild

Bundle frontend javascript from separate files using ordinary property get/set syntax. Configuration is neither necessary nor possible. Code is wrapped but not otherwise altered. The output is readable and debug-friendly. Here's what it looks like:

```js
const foo = include.foo

declare.myModule = function () {
    alert('Hello world!')
}
```

This syntax is not transpiled to something else. The implementation is just object property assignment and lookup, exactly as written in the code above, with some sanity checks and other protections built-in by some code that gets prepended to the output file. The output will contain the code exactly as authored, with each file wrapped in its own scope closure, and arranged in order so that your `declare` and `include` statements (property get/set operations) resolve properly.

## Installation & Use

```shell
npm install minbuild -g
```

Compile a javascript bundle as follows:

```shell
minbuild ./my-project
```

This creates a file at `./my-project/my-project.build.js`, containing the compiled output. Unused javascript files are not included in the build file.
