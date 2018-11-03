'use strict'

const fs = require('fs')
const assert = require('assert')
const testProjectFile = fs.readFileSync(__dirname + '/test-project/test-project.build.js', 'utf8')

// Execute the code; make it sure it runs error-free.
assert.doesNotThrow(
	() => eval(testProjectFile)
)

// See whether the dead code was eliminated.
assert(!testProjectFile.includes('deadCode'))
