'use strict'

module.exports = function (src) {
	let pos = 0
	const ln = src.length
	while (pos < ln) {
		const next2 = src.slice(pos, pos + 2)
		if (next2 === '//') {
			const commentLn = src.slice(pos).indexOf('\n')
			src = src.slice(0, pos) + src.slice(pos + commentLn)
			continue
		}
		if (next2 === '/*') {
			const commentLn = src.slice(pos).indexOf('*/')
			src = src.slice(0, pos) + src.slice(pos + commentLn + 2)
			continue
		}
		pos++
	}
	return src
}