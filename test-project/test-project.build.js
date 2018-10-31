																																								/*__COMP*/void function(){'use strict';const __deps = {};const include = new Proxy(__deps,{	set: function(_,prop){throw new Error('Attempted to set property "' + prop  + '" on include.')},	get: function(target,prop){		if(prop in target){return target[prop]}		else{throw new Error(prop + ' has not been declared.')}	}});const declare = new Proxy(__deps,{	get: function (_,prop) {throw new Error('Attempted to read property "' + prop + '" from declare.')},	set: function (obj,prop,v) {		if(prop in obj){throw new Error(prop + ' has already been declared.')}		else{obj[prop]=v;return true}	}});;void function(){
// bar 

const baz = require.baz

declare.bar = function () {
	baz()
}

																																								}();void function(){
// foo 

const bar = include.bar

declare.foo = function () {
	bar()
}

																																								}();void function(){
// anonymous/main 

const foo = include.foo

foo()

																																								}()
																																								}()