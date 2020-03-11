package auth

import (
	"errors"
	"k8s.io/client-go/tools/clientcmd/api"
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

func (l *LoginData) GetAuthInfo() (*api.AuthInfo, error) {
	authInfo := api.AuthInfo{}

	if len(l.Token) > 0 {
		authInfo.Token = l.Token
	} else if len(l.Username) > 0 && len(l.Password) > 0 {
		authInfo.Username = l.Username
		authInfo.Password = l.Password
	} else if len(l.KubeConfig) > 0 {
		// TODO
		return nil, errors.New("Not implement")
	} else {
		return nil, errors.New("can't get auth info from login data")
	}

	return &authInfo, nil
}
