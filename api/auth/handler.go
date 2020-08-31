package auth

import (
	"errors"
	"github.com/labstack/echo/v4"
	"k8s.io/client-go/tools/clientcmd/api"
	"strings"
)

type LoginData struct {
	// basic authentication to the kubernetes cluster
	Username string `form:"username" json:"username"`
	Password string `from:"password" json:"password"`

	// kube config file content past for client-go for authorization
	KubeConfig string `form:"kubeconfig" json:"kubeconfig"`

	// bearer token for authentication to the kubernetes cluster
	Token string `form:"token" json:"token"`
}

func ExtractTokenFromHeader(header string) string {
	if header != "" && strings.HasPrefix(header, "Bearer ") {
		return strings.TrimPrefix(header, "Bearer ")
	}
	return ""
}

func GetAuthInfo(c echo.Context) (*api.AuthInfo, error) {
	var loginData LoginData

	if err := c.Bind(&loginData); err != nil {
	}

	authInfo := api.AuthInfo{}

	authHeader := c.Request().Header.Get(echo.HeaderAuthorization)

	if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
		authInfo.Token = ExtractTokenFromHeader(authHeader)
	} else if len(loginData.Token) > 0 {
		authInfo.Token = loginData.Token
	} else if len(loginData.Username) > 0 && len(loginData.Password) > 0 {
		authInfo.Username = loginData.Username
		authInfo.Password = loginData.Password
	} else if len(loginData.KubeConfig) > 0 {
		// TODO
		return nil, errors.New("Not implement")
	} else {
		return nil, errors.New("can't get auth info from login data")
	}

	return &authInfo, nil
}
