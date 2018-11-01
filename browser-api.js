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