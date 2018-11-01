#!/usr/bin/env node
'use strict'

const {join, basename} = require('path')
const {readFileSync, writeFileSync} = require('fs')
const files = []
const readdir = require('./read-all')(files)
const api = (readFileSync(__dirname + '/browser-api.js', 'utf8')).split(/[\n\t]/).join('')

// Wrap the code in a closure.
function wrap(file) {
	const code = file.content.split('\n').join('\n\t')
	return `;(function(){\n\n\t//// Module: ${file.declares}\n\n\t${code}\n\n})()`
}

// Filter out dead code.
function removeNonIncluded(files) {
	return files.filter(file => { // Drop files that are not needed.
		const name = file.declares
		return (
			name === 'main' || 
			files.some(otherFile => otherFile.includes.includes(name))
		)
	})
}

// Make sure all includes were declared; else throw.
function everythingWasDeclared(files) {
	const includes = []
	const declared = []
	files.forEach(f => (
		includes.push(...f.includes),
		declared.push(f.declares)
	))
	includes.forEach(include => {
		if (!declared.includes(include)) {
			throw new Error(`Attempted to include ${include} but it was never declared.`)
		}
	})
}

// Resolve the dependencies to a serial order.
function organize(files) {
	files = removeNonIncluded(files)
	everythingWasDeclared(files)
	let count = 0
	const limit = files.length**2
	for (let defPos = 0; defPos < files.length; defPos++) {
		if (count > limit) {
			// Todo: Record the sequence of dependencies, and use that to
			// 		 produce a helpful message about fixing the circularity.
			throw new Error('Dependencies are circular.')
		}
		const definition = files[defPos]
		if (files.some((file, includePos) => (
			defPos > includePos && 
			file.includes.includes(definition.declares)
		))) {
			files.splice(defPos, 1)
			files.splice(defPos - 1, 0, definition)
			defPos = 0 // Start over.
			count++
			continue
		}
	}
	return files
}

// Consume the JS files in the given directory to create a code bundle string.
function compile(dirPath) {
	const files = readdir(dirPath)
	const code = organize(files).map(wrap).join('')
	return ';(function(){\'use strict\';' + api + code + '})()'
}

// Get the CLI argument and write an output file.
const targetDir = join(process.cwd(), (process.argv[2] || ''))
writeFileSync(join(targetDir, (basename(targetDir) + '.build.js')), compile(targetDir))
