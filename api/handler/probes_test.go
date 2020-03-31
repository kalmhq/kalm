package handler

import (
	"github.com/stretchr/testify/suite"
	"net/http"
	"testing"
)

type ProbesTestSuite struct {
	WithControllerTestSuite
}

func (suite *ProbesTestSuite) TestProbe() {
	rec := suite.NewRequest(http.MethodGet, "/ping", nil)
	suite.Equal("ok", rec.BodyAsString())
}

func TestProbesTestSuite(t *testing.T) {
	suite.Run(t, new(ProbesTestSuite))
}
