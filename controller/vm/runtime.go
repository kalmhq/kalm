package vm

import (
	"encoding/json"
	js "github.com/dop251/goja"
)

func initRuntime(runtime *js.Runtime) {
	initConsole(runtime)
	runtime.Set("global", runtime.GlobalObject())
}

func InitRuntime() *js.Runtime {
	runtime := js.New()
	initRuntime(runtime)
	return runtime
}

func CompileProgram(src string) (*js.Program, error) {
	return js.Compile("", wrapScript(src), true)
}

func RunMethod(runtime *js.Runtime, program *js.Program, hookName string, args ...interface{}) (interface{}, error) {
	runtime.Set("__targetMethodName", hookName)
	_args := make([]interface{}, 0, len(args))

	for i := range args {
		arg := args[i]

		switch val := arg.(type) {
		case string, int, int8, int16, int32, int64, float32, float64, uint, uint8, uint16, uint32, uint64, bool:
			_args = append(_args, val)
		default:
			bts, _ := json.Marshal(arg)
			obj := make(map[string]interface{})
			_ = json.Unmarshal(bts, &obj)
			_args = append(_args, obj)
		}
	}

	runtime.Set("__args", _args)

	res, err := runtime.RunProgram(program)

	if err != nil {
		return nil, err
	}

	return res.Export(), nil
}
