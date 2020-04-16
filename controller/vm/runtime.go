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

func GetDefinedMethods(src string, methods []string) (map[string]bool, error) {
	program, err := js.Compile("", getMethodsWrap(src), true)

	if err != nil {
		return nil, err
	}

	runtime := InitRuntime()
	runtime.Set("__methods", methods)
	res, err := runtime.RunProgram(program)

	if err != nil {
		return nil, err
	}

	tmp := make(map[string]bool)

	for k, v := range res.Export().(map[string]interface{}) {
		tmp[k] = v.(bool)
	}

	return tmp, nil
}

func RunMethod(runtime *js.Runtime, program *js.Program, hookName string, dest interface{}, args ...interface{}) error {
	runtime.Set("__targetMethodName", hookName)

	if args != nil {
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
	}

	res, err := runtime.RunProgram(program)

	if err != nil {
		return err
	}

	if dest == nil {
		return nil
	}

	resInterface := res.Export()

	bts, err := json.Marshal(resInterface)

	if err != nil {
		return err
	}

	return json.Unmarshal(bts, dest)
}
