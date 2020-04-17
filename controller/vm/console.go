package vm

import (
	"fmt"
	js "github.com/dop251/goja"
	"io"
	"os"
)

// TODO: use a log instead
func _outputTo(w io.Writer) func(js.FunctionCall) js.Value {
	return func(call js.FunctionCall) js.Value {
		for i := range call.Arguments {
			_, _ = fmt.Fprint(w, call.Arguments[i].String())
			if i < len(call.Arguments)-1 {
				_, _ = fmt.Fprint(w, " ")
			}
		}
		_, _ = fmt.Fprint(w, "\n")
		return js.Undefined()
	}
}

func initConsole(vm *js.Runtime) {
	console := vm.NewObject()
	_ = console.Set("log", _outputTo(os.Stdout))
	_ = console.Set("debug", _outputTo(os.Stdout))
	_ = console.Set("error", _outputTo(os.Stderr))
	vm.Set("console", console)
}
