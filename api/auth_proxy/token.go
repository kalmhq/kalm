package auth_proxy

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
)

// This is a simplified Token of oidc.Token
// This token is used to safely transfer id_token and refresh_token between dex and auth-proxy, auth-proxy and protected endpoint.
// And this is also the encrypted structure of the cookie in protected_endpoint
type ThinToken struct {
	RefreshToken  string `json:"r"`
	IDTokenString string `json:"i"`
}

// the result is save to use in url query
// TODO: cookie encrypt key rotation? Maybe we should use something like https://github.com/gorilla/securecookie.
func (t *ThinToken) Encode() (string, error) {
	thinTokenBytes, err := json.Marshal(t)

	if err != nil {
		return "", fmt.Errorf("thin token json encode error, %+v", err)
	}

	encryptedThinToken, err := AesEncrypt(thinTokenBytes)

	if err != nil {
		return "", fmt.Errorf("encrypt encode thin token failed, %+v", err)
	}

	base64EncodedThinToken := base64.RawStdEncoding.EncodeToString(encryptedThinToken)
	return base64EncodedThinToken, nil
}

func (t *ThinToken) Decode(data string) error {
	encryptedThinToken, err := base64.RawStdEncoding.DecodeString(data)

	if err != nil {
		return fmt.Errorf("base64 decode thin token failed, %+v", err)
	}

	thinTokenBytes, err := AesDecrypt(encryptedThinToken)

	if err != nil {
		return fmt.Errorf("decrypt thin token failed, %+v", err)
	}

	err = json.Unmarshal(thinTokenBytes, t)

	if err != nil {
		return fmt.Errorf("json unmarshal thin token failed, %+v", err)
	}

	return nil
}
