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

	console.debug("invoke", __targetMethodName);

	return __targetMethod.apply(null, __args);
}

// run
__entrypoint();
`
	return src + entrypoint
}
