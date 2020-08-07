package auth

import (
	"bytes"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"net/http"

	"testing"
)

func Test_ExtractTokenFromHeader(t *testing.T) {
	header0 := ExtractTokenFromHeader("Bearer hToken")
	header1 := ExtractTokenFromHeader("hToken")

	assert.EqualValues(t, "hToken", header0)
	assert.EqualValues(t, "", header1)
}

func Test_GetAuthInfo(t *testing.T) {
	echoServer := echo.New()

	badBody := bytes.NewBufferString("bad body")
	req0, _ := http.NewRequest("GET", "/url", badBody)
	ctx0 := echoServer.NewContext(req0, nil)
	_, err0 := GetAuthInfo(ctx0)
	assert.NotNil(t, err0)

	bodyWithToken := bytes.NewBufferString("{\n\t\"username\":\"kevin\",\n\t\"password\":\"password\",\n\t\"token\":\"token\",\n\t\"kubeconfig\":\"kubeconfig\"\n}")
	req1, _ := http.NewRequest("GET", "/url", bodyWithToken)
	req1.Header = map[string][]string{
		echo.HeaderContentType: []string{echo.MIMEApplicationJSON},
		echo.HeaderAuthorization: []string{"Bearer hToken"},
	}
	ctx1 := echoServer.NewContext(req1, nil)
	authInfo1, err1 := GetAuthInfo(ctx1)

	assert.Nil(t, err1)
	assert.EqualValues(t, "hToken", authInfo1.Token)

	bodyWithToken = bytes.NewBufferString("{\n\t\"username\":\"username\",\n\t\"password\":\"password\",\n\t\"token\":\"token\",\n\t\"kubeconfig\":\"kubeconfig\"\n}")
	req2, _ := http.NewRequest("GET", "/url", bodyWithToken)
	req2.Header = map[string][]string{
		echo.HeaderContentType: []string{echo.MIMEApplicationJSON},
	}
	ctx2 := echoServer.NewContext(req2, nil)
	authInfo2, err2 := GetAuthInfo(ctx2)

	assert.Nil(t, err2)
	assert.EqualValues(t, "token", authInfo2.Token)

	bodyWithPassword := bytes.NewBufferString("{\n\t\"username\":\"username\",\n\t\"password\":\"password\",\n\t\"kubeconfig\":\"kubeconfig\"\n}")
	req3, _ := http.NewRequest("GET", "/url", bodyWithPassword)
	req3.Header = map[string][]string{
		echo.HeaderContentType: []string{echo.MIMEApplicationJSON},
	}
	ctx3 := echoServer.NewContext(req3, nil)
	authInfo3, err3 := GetAuthInfo(ctx3)

	assert.Nil(t, err3)
	assert.EqualValues(t, "username", authInfo3.Username)
	assert.EqualValues(t, "password", authInfo3.Password)

	bodyWithConfig := bytes.NewBufferString("{\n\t\"kubeconfig\":\"kubeconfig\"\n}")
	req4, _ := http.NewRequest("GET", "/url", bodyWithConfig)
	req4.Header = map[string][]string{
		echo.HeaderContentType: []string{echo.MIMEApplicationJSON},
	}
	ctx4 := echoServer.NewContext(req4, nil)
	_, err4 := GetAuthInfo(ctx4)

	assert.EqualValues(t, "Not implement", err4.Error())

	nonBody := bytes.NewBufferString("{}")
	req5, _ := http.NewRequest("GET", "/url", nonBody)
	req5.Header = map[string][]string{
		echo.HeaderContentType: []string{echo.MIMEApplicationJSON},
	}
	ctx5 := echoServer.NewContext(req5, nil)
	_, err5 := GetAuthInfo(ctx5)

	assert.EqualValues(t, "can't get auth info from login data", err5.Error())
}
