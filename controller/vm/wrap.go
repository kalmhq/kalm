package vm

//go:generate go-bindata -pkg vm -nometadata ../resources/es6-shim.polyfill.js

var polyfill string

func init() {
	// The \n is important. Otherwise the following code may be treated as comments.
	polyfill = string(MustAsset("../resources/es6-shim.polyfill.js")) + "\n;"
}

func wrapScript(src string) string {
	entryPoint := `
;
function __entrypoint() {
	console.debug("entryPoint begin. Calling method:", __targetMethodName);

	var __targetMethod = global[__targetMethodName];

	if (typeof __targetMethod === "undefined") {
		throw(__targetMethodName + " function is not defined.")
    }

	console.debug("invoke", __targetMethodName);

	if (typeof __args !== "undefined") {
		return __targetMethod.apply(null, __args);
	}

	return __targetMethod.apply(null);	
}

// run
__entrypoint();
`
	return polyfill + src + entryPoint
}

func getMethodsWrap(src string) string {
	entryPoint := `
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
	return polyfill + src + entryPoint
}
