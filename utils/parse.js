'use strict'

module.exports = function (file) {
	const model = {
		declares: '',
		includes: []
	}
	let pos = 0
	const ln = file.length
	while (pos < ln) {

		// Comments
		const next2 = file.slice(pos,pos+2)
		if (next2 === '//') {
			pos++
			pos += file.slice(pos).indexOf('\n') + 1
			continue
		}
		if (next2 === '/*') {
			pos++
			pos += file.slice(pos).indexOf('*/') + 2
			continue
		}

		const notEscaped = file[pos-1] !== '\\'
		const next = file[pos]

		// String literals
		if (next === '"' && notEscaped) {
			pos++
			pos += file.slice(pos).indexOf('"') + 1
			continue
		}
		if (next === '\'' && notEscaped) {
			pos++
			pos += file.slice(pos).indexOf('\'') + 1
			continue
		}
		if (next === '`' && notEscaped) {
			pos++
			pos += file.slice(pos).indexOf('`') + 1
			continue
		}
		
		const next9 = file.slice(pos, pos + 9)
		if (/\bdeclare\.[a-zA-Z$_]/.test(next9)) {
			const tail = file.slice(pos + 8)
			const nameStr = tail.slice(0, tail.search(/[=]/)).trim()
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
			const nameStr = tail.slice(0, tail.search(/[\s.]/)).trim()
			model.includes.push(nameStr)
			pos += 9
			continue
		}
		pos++
	}
	model.declares = model.declares || 'main'
	return model
}