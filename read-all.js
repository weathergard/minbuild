'use strict'

const {readdirSync, readFileSync, statSync} = require('fs')
const {join} = require('path')
const parse = require('./parse')

// Recursively get all the files in the directory.
module.exports = function (files) {
	return function readdir(dirPath) {
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
}
