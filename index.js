'use strict'

// Todo: Handle escape sequences in string literals and handle regex literals.
const {join, basename} = require('path')
const {readdirSync, readFileSync, statSync, writeFileSync} = require('fs') 
const files = []

function parse(file) {
	const model = {
		declares: '',
		includes: []
	}
	let pos = 0
	const ln = file.length
	while (pos < ln) {

		// Comments
		const next9 = file.slice(pos, pos + 9)
		if (file.slice(pos,pos+2) === '//') {
			pos++
			pos += file.slice(pos).indexOf('\n') + 1
			continue
		}
		if (file.slice(pos,pos+2) === '/*') {
			pos++
			pos += file.slice(pos).indexOf('*/') + 2
			continue
		}

		// String literals
		if (file[pos] === '"') {
			pos++
			pos += file.slice(pos).indexOf('"') + 1
			continue
		}
		if (file[pos] === '\'') {
			pos++
			pos += file.slice(pos).indexOf('\'') + 1
			continue
		}
		if (file[pos] === '`') {
			pos++
			pos += file.slice(pos).indexOf('`') + 1
			continue
		}
		
		if (/\bdeclare\.[a-zA-Z$_]/.test(next9)) {
			const tail = file.slice(pos + 8)
			const nameStr = tail.slice(0, tail.indexOf('=')).trim()
			if (model.declares) {
				throw new Error(
					`Already declared ${model.declares}, then attempted to declare ${nameStr}.`
				)
			}
			model.declares = nameStr
			pos += 9
			continue
		}
		if (/\binclude\.[a-zA-Z$_]/.test(next9)) {
			const tail = file.slice(pos + 8)
			const nameStr = tail.slice(0, tail.search(/[\s]/)).trim()
			model.includes.push(nameStr)
			pos += 9
			continue
		}
		pos++
	}
	return model
}

// Recursively get all the files in the directory.
function readdir(dirPath) {
	readdirSync(dirPath).forEach(relPath => {
		const contentAbsPath = join(dirPath, relPath)
		if (statSync(contentAbsPath).isFile()) {
			if (contentAbsPath.toLowerCase().slice(-3) !== '.js') {
				return // Skip non-js files.
			}
			const content = readFileSync(contentAbsPath, 'utf8').trim()
			if (!content.includes('const include=new Proxy(__deps,{')) {
				const {declares, includes} = parse(content)
				files.push({content, declares, includes, fpath:contentAbsPath})
			}
		} else {
			readdir(contentAbsPath)
		}
	})
	return files
}

// Wrap the code in a closure.
function wrap(file) {
	const name = file.declares
	const comment = '// ' + name + ' '
	return (
		';void function(){\n' + comment + '\n' +
		`\n${file.content}\n\n` + ''.padStart(40, '\t') + '}()'
	)
}

// Filter out dead code.
function removeNonIncluded(files) {
	return files.filter(file => { // Drop files that are not needed.
		const name = file.declares || 'anonymous/main'
		return (
			(name === 'anonymous/main') ||
			files.some(otherFile => otherFile.includes.includes(name))
		)
	})
}

// Resolve the dependencies to a plain serial order.
function organize(files) {
	files = removeNonIncluded(files)
	let count = 0
	const limit = files.length**2
	for (let defPos = 0; defPos < files.length; defPos++) { 
		if (count > limit) {
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
