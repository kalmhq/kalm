package log

import "testing"

func TestLogger(t *testing.T) {
	Debug("debug")
	Info("info")
	Error(nil, "error")

	InitDefaultLogger("debug")
	Debug("debug")
	Info("info")
	Error(nil, "error")

	InitDefaultLogger("error")
	Debug("debug")
	Info("info")
	Error(nil, "error")
}
