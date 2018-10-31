'use strict'

const {join, basename} = require('path')
const {readdirSync, readFileSync, statSync, writeFileSync} = require('fs') 
const files = []

// Recursively get all the files in the directory.
function readdir(dirPath) {
	readdirSync(dirPath).forEach(relPath => {
		const contentAbsPath = join(dirPath, relPath)
		if (statSync(contentAbsPath).isFile()) {
			const content = readFileSync(contentAbsPath, 'utf8').trim()
			if (!content.includes('/*__COMP*/')) {
				files.push({content, fpath: contentAbsPath})
			}
		} else {
			readdir(contentAbsPath)
		}
	})
	return files
}

// Find the name from an epression of the form: "declare.theName".
function getName(file) {
	const tail = file.content.split('declare.')[1] || 'anonymous/main'
	const spacePos = tail.search(/[\s;]/)
	return tail.slice(0, ~spacePos ? spacePos : tail.length)
}

function wrap(file) {
	const name = getName(file) || 'main'
	const comment = '// ' + name + ' '
	return (
		';void function(){\n' + comment + '\n' +
		`\n${file.content}\n\n` + ''.padStart(40, '\t') + '}()'
	)
}

function removeNonIncluded(files) {
	return files.filter(file => { // Drop files that are not needed.
		const name = getName(file)
		return (
			name == 'anonymous/main' ||
			files.some(otherFile => otherFile.content.includes('include.' + name))
		)
	})
}

function max1Declare(files) {
	files.forEach(file => { // 1 "declare" permitted per file.
		if (file.content.split('declare.').length > 2) {
			throw new Error(`Multiple declare statements in: ...${file.fpath.slice(-20)}`)
		}
	})
}

function organize(files) {
	max1Declare(files)
	files = removeNonIncluded(files)
	let count = 0 // Resolve the dependency order.
	for (let defPos = 0; defPos < files.length; defPos++) { 
		if (count > (files.length * 100)) { // Obviously a hack.
			throw new Error('Circular dependencies.')
		}
		const definition = files[defPos]
		const include = 'include.' + getName(definition)
		if (files.some((file, includePos) => defPos > includePos && file.content.includes(include))) {
			files.splice(defPos, 1)
			files.splice(defPos - 1, 0, definition)
			defPos = 0 // Start over.
			count++
			continue
		}
	}
	return files
}

const api = /*js*/`
const __deps = {};
const include = new Proxy(__deps,{
	set: function(_,prop){throw new Error('Attempted to set property "' + prop  + '" on include.')},
	get: function(target,prop){
		if(prop in target){return target[prop]}
		else{throw new Error(prop + ' has not been declared.')}
	}
});
const declare = new Proxy(__deps,{
	get: function (_,prop) {throw new Error('Attempted to read property "' + prop + '" from declare.')},
	set: function (obj,prop,v) {
		if(prop in obj){throw new Error(prop + ' has already been declared.')}
		else{obj[prop]=v;return true}
	}
});
`

function compile(dirPath) {
	const files = readdir(dirPath)
	const code = organize(files).map(wrap).join('')
	const setup = api.split('\n').join('')
	return (
		''.padStart(40, '\t') + 
		'/*__COMP*/void function(){\'use strict\';' + setup + code + 
		'\n' + ''.padStart(40, '\t') + '}()'
	)
}

const targetDir = join(process.cwd(), (process.argv[2] || ''))
writeFileSync(join(targetDir, (basename(targetDir) + '.build.js')), compile(targetDir))
