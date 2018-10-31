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
			if (!content.includes('const include=new Proxy(__deps,{')) {
				files.push({content, name:getName(content), fpath:contentAbsPath})
			}
		} else {
			readdir(contentAbsPath)
		}
	})
	return files
}

// Find the name from an epression of the form: "declare.theName".
function getName(fileContent) {
	const tail = fileContent.split('declare.')[1] || 'anonymous/main'
	const spacePos = tail.search(/[\s=]/)
	return tail.slice(0, ~spacePos ? spacePos : tail.length)
}

// Wrap the code in a closure.
function wrap(file) {
	const name = file.name
	const comment = '// ' + name + ' '
	return (
		';void function(){\n' + comment + '\n' +
		`\n${file.content}\n\n` + ''.padStart(40, '\t') + '}()'
	)
}

// Filter out dead code.
function removeNonIncluded(files) {
	return files.filter(file => { // Drop files that are not needed.
		const name = file.name
		return (
			(name === 'anonymous/main') ||
			files.some(otherFile => otherFile.content.includes('include.' + name))
		)
	})
}

// Do not tolerate multiple declare statements in a single file.
function max1Declare(files) {
	files.forEach(file => {
		if (file.content.split('declare.').length > 2) {
			throw new Error(`Multiple declare statements in: ...${file.fpath.slice(-20)}`)
		}
	})
}

// Resolve the dependencies to a plain serial order.
function organize(files) {
	max1Declare(files)
	files = removeNonIncluded(files)
	let count = 0
	for (let defPos = 0; defPos < files.length; defPos++) { 
		if (count > (files.length**2)) {
			throw new Error('Dependencies are circular.')
		}
		const definition = files[defPos]
		const include = 'include.' + definition.name
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

// The static module API (included in the output).
const api = /*js*/`
const __deps={};
const include=new Proxy(__deps,{
	set:function(_,p){throw new Error('Attempted to set property "'+p+'" on include.')},
	get:function(t,p){
		if(p in t){return t[p]}
		else{throw new Error(p+' was not declared.')}
	}
});
const declare=new Proxy(__deps,{
	get:function(_,p){throw new Error('Attempted to read property "'+p+'" from declare.')},
	set:function(o,p,v){
		if(p in o){throw new Error(p+' was already declared.')}
		else{o[p]=v;return true}
	}
})
`

// Consume the JS files in the given directory to create a code bundle string.
function compile(dirPath) {
	const files = readdir(dirPath)
	const code = organize(files).map(wrap).join('')
	const setup = api.split(/[\n\t]/).join('')
	return (
		''.padStart(40, '\t') + 
		'void function(){\'use strict\';' + setup + code + 
		'\n' + ''.padStart(40, '\t') + '}()'
	)
}

// Get the CLI argument and write an output file.
const targetDir = join(process.cwd(), (process.argv[2] || ''))
writeFileSync(join(targetDir, (basename(targetDir) + '.build.js')), compile(targetDir))
