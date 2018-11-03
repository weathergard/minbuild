# MinBuild

Bundle frontend javascript from separate files using ordinary property get/set syntax. Configuration is neither necessary nor possible. Code is wrapped but not altered. The output is readable and debug-friendly.

Import and export values using the `include` and `declare` identifiers. Like this:

```js
const foo = include.foo

declare.myModule = function () {
    alert('Hello world!')
}
```

This syntax is not transpiled to something else. The implementation is just object property assignment and lookup, exactly as written in the code above, with some sanity checks and other protections built-in by some code that gets prepended to the output file. The output will contain the code exactly as authored, with each file wrapped in its own scope closure, and arranged in order so that the `include` statements work. See the test project for an example output file.

## Installation & Use

```shell
npm install minbuild -g
```

Compile a javascript bundle as follows:

```shell
minbuild ./my-project
```

It will read the files and resolve the dependencies, and then report back:

```
my-project.build.js is 48.65KB from 18 files totaling ≈ 1940 SLOC.
```

The output file is placed inside the project directory. Unused javascript files are not included in the build file. You can save a little space by stripping comments with the `--remove-comments` flag.
