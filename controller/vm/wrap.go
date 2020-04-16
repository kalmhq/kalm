package vm

func wrapScript(src string) string {
	entrypoint := `
;
function __entrypoint() {
	console.debug("entrypoint begin. Calling method:", __targetMethodName);

	var __targetMethod = global[__targetMethodName];

	if (typeof __targetMethod === "undefined") {
		throw(__targetMethodName + " function is not defined.")
    }

	console.debug("scope is", typeof scope === "undefined" ? "undefined" : scope);
	console.debug("invoke", __targetMethodName);

	if (typeof __args !== "undefined") {
		return __targetMethod.apply(null, __args);
	}

	return __targetMethod.apply(null);	
}

// run
__entrypoint();
`
	return polyfill + src + entrypoint
}

func getMethodsWrap(src string) string {
	entrypoint := `
;
function __getMethods() {
	var res = {};

	for (var i=0;i<__methods.length;i++) {
		var method = __methods[i];
		res[method] = typeof global[method] === "function";
	}

	return res;
}

__getMethods();
`
	return polyfill + src + entrypoint
}
