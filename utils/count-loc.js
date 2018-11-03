'use stict'

const stripComments = require('./strip-comments')

module.exports = function (src) {
	src = stripComments(src)

	// Remove redundant newlines.
	src = src.replace(/\n+/g, '\n')

	return src.match(/\n/g).length
}
