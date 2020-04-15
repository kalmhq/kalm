package vm

import (
	"github.com/stretchr/testify/suite"
	"strings"
	"testing"
)

type VmTestSuite struct {
	suite.Suite
}

func (suite *VmTestSuite) TestBasic() {
	var err error
	runtime := InitRuntime()
	program, _ := CompileProgram(`
function fakeHookName(stringArg) {
	return stringArg;
}
`)
	_, err = RunMethod(runtime, program, "test")
	suite.NotNil(err)
	suite.True(strings.Contains(err.Error(), "test function is not defined."))

	res, err := RunMethod(runtime, program, "fakeHookName", "sample-string")
	suite.Nil(err)
	suite.Equal("sample-string", res)
}

func (suite *VmTestSuite) TestComplicatedArguments() {
	runtime := InitRuntime()
	program, _ := CompileProgram(`
function fakeHookName(stringArg, boolArg, numberArg, deepMap) {
	if (typeof stringArg !== "string") {
		throw("expect stringArg as a string");
	}

	if (typeof boolArg !== "boolean") {
		throw("expect boolArg as a boolean");
	}

	if (typeof numberArg !== "number") {
		throw("expect numberArg as a number");
	}

	if (typeof deepMap !== "object") {
		throw("expect deepMap as an object");
	}

	return deepMap.a.b.c.d;
}
`)
	res, err := RunMethod(runtime, program, "fakeHookName", "abc", true, 123, map[string]interface{}{
		"a": map[string]interface{}{
			"b": map[string]interface{}{
				"c": map[string]interface{}{
					"d": "yeah!",
				},
			},
		},
	})

	suite.Nil(err)
	suite.Equal("yeah!", res)
}

func (suite *VmTestSuite) TestBadSourceCode() {
	program, err := CompileProgram(`This is not a valid js content.`)
	suite.NotNil(err)
	suite.Nil(program)
}

func TestVmSuite(t *testing.T) {
	suite.Run(t, new(VmTestSuite))
}
