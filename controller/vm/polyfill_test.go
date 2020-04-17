package vm

import (
	"github.com/stretchr/testify/suite"
	"testing"
)

type PolyfillTestSuite struct {
	suite.Suite
}

func (suite *PolyfillTestSuite) TestPolyfill_String_endsWiths() {
	runtime := InitRuntime()
	p, err := CompileProgram(`
function run(){
	return "test".endsWith("t");
}
`)
	suite.Nil(err)
	var dest bool
	err = RunMethod(runtime, p, "run", nil, &dest)
	suite.Nil(err)
	suite.True(dest)

	p, err = CompileProgram(`
function run(){
	return "test".endsWith("A");
}
`)

	suite.Nil(err)
	err = RunMethod(runtime, p, "run", nil, &dest)
	suite.Nil(err)
	suite.False(dest)
}

func TestPolyfillTestSuite(t *testing.T) {
	suite.Run(t, new(PolyfillTestSuite))
}
