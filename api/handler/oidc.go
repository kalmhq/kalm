package handler

import (
	"bytes"
	"context"
	"crypto/md5"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/coreos/go-oidc"
	"github.com/kalmhq/kalm/api/utils"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/controllers"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
	"golang.org/x/oauth2"
	coreV1 "k8s.io/api/core/v1"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
)

var oauth2Config *oauth2.Config
var oauth2ConfigMut = &sync.Mutex{}
var stateEncryptKey [16]byte
var oidcProvider *oidc.Provider
var oidcVerifier *oidc.IDTokenVerifier
var oidcProviderInfo *controllers.OIDCProviderInfo

var authProxyURL string
var clientSecret string

const ID_TOKEN_COOKIE_NAME = "id_token"
const ID_TOKEN_QUERY_NAME = "id_token"

const ENVOY_EXT_AUTH_PATH_PREFIX = "ext_authz"

// CSRF protection and pass payload
type OauthState struct {
	Nonce       string
	OriginalURL string
}

func (h *ApiHandler) getOauth2Config() *oauth2.Config {
	if oauth2Config != nil {
		return oauth2Config
	}

	oauth2ConfigMut.Lock()
	defer oauth2ConfigMut.Unlock()

	if oauth2Config != nil {
		return oauth2Config
	}

	clientID := os.Getenv("KALM_OIDC_CLIENT_ID")
	clientSecret = os.Getenv("KALM_OIDC_CLIENT_SECRET")
	oidcProviderUrl := os.Getenv("KALM_OIDC_PROVIDER_URL")

	if clientID == "" || clientSecret == "" || oidcProviderUrl == "" {
		builder := h.KalmBuilder()
		var dexSecret coreV1.Secret
		err := builder.Get(controllers.KAPP_DEX_NAMESPACE, controllers.KAPP_DEX_SECRET_NAME, &dexSecret)

		if err != nil {
			h.logger.Error("Can't get dex secret")
			return nil
		}

		clientID = string(dexSecret.Data["client_id"])
		clientSecret = string(dexSecret.Data["client_secret"])

		var ssoConfigList v1alpha1.SingleSignOnConfigList
		err = builder.List(&ssoConfigList)

		if err != nil {
			h.logger.Error("Can't list ssoConfigs")
			return nil
		}

		if len(ssoConfigList.Items) > 1 || len(ssoConfigList.Items) == 0 {
			h.logger.Error("Found no or more than one sso configs. Nothing will happen until there is only one sso config.")
			return nil
		}

		oidcProviderInfo = controllers.GetOIDCProviderInfo(&ssoConfigList.Items[0])
		oidcProviderUrl = oidcProviderInfo.Issuer
		authProxyURL = oidcProviderInfo.ExtAuthzServerUrl + "/oidc/login"
	}

	stateEncryptKey = md5.Sum([]byte(clientSecret))

	provider, err := oidc.NewProvider(context.Background(), oidcProviderUrl)

	if err != nil {
		log.Error("KALM new provider failed.")
		return nil
	}

	oidcProvider = provider
	oidcVerifier = provider.Verifier(&oidc.Config{ClientID: clientID})

	// if set up dex later, how to make sure provider exist?

	scopes := []string{}
	scopes = append(scopes, oidc.ScopeOpenID, "profile", "email", "groups")

	// get current path from headers

	oauth2Config = &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Endpoint:     provider.Endpoint(),
		Scopes:       scopes,
		RedirectURL:  oidcProviderInfo.ExtAuthzServerUrl + "/oidc/callback",
	}

	return oauth2Config
}

func removeExtAuthPathPrefix(path string) string {
	if strings.HasPrefix(path, "/"+ENVOY_EXT_AUTH_PATH_PREFIX) {
		// remove prefix "/" + ENVOY_EXT_AUTH_PATH_PREFIX
		path = path[len(ENVOY_EXT_AUTH_PATH_PREFIX)+1:]
	}

	if path == "" {
		path = "/"
	}

	return path
}

func getOriginalURL(c echo.Context) string {
	requestURI := removeExtAuthPathPrefix(c.Request().RequestURI)
	ur := fmt.Sprintf("%s://%s%s", c.Scheme(), c.Request().Host, requestURI)
	log.Debug("original url ", ur)
	return ur
}
func getStringSignature(data string) string {
	signBytes := sha256.Sum256(append([]byte(data), []byte(clientSecret)...))
	signString := base64.RawStdEncoding.EncodeToString(signBytes[:])
	return signString
}

func redirectToAuthProxyUrl(c echo.Context) error {
	originalURL := getOriginalURL(c)
	uri, err := url.Parse(authProxyURL)

	if err != nil {
		log.Error("parse auth proxy url error.", err)
		return err
	}

	params := uri.Query()
	params.Add("original_url", originalURL)
	params.Add("sign", getStringSignature(originalURL))

	uri.RawQuery = params.Encode()

	return c.Redirect(302, uri.String())
}

///////////////////////////////////
// Run as Envoy ext_authz filter //
///////////////////////////////////

func (h *ApiHandler) handleExtAuthz(c echo.Context) error {
	if h.getOauth2Config() == nil {
		return c.String(503, "Please configure KALM OIDC environments.")
	}

	// if there is authorization header, skip the ext authz
	// envoy jwt_authn will handle the reset logic
	if c.Request().Header.Get(echo.HeaderAuthorization) != "" {
		return c.NoContent(200)
	}

	if c.QueryParam(ID_TOKEN_QUERY_NAME) != "" {
		return handleSetIDToken(c)
	}

	cookie, err := c.Cookie(ID_TOKEN_COOKIE_NAME)

	if err != nil {
		log.Println(c.RealIP(), c.Path(), "No auth cookie, redirect to auth proxy")
		return redirectToAuthProxyUrl(c)
	}

	if cookie.Value == "" {
		log.Println(c.RealIP(), c.Path(), "Auth cookie value empty, redirect to auth proxy")
		return redirectToAuthProxyUrl(c)
	}

	_, err = oidcVerifier.Verify(context.Background(), cookie.Value)

	if err != nil {
		log.Error("jwt verify failed", err)
		cookie.Value = ""
		c.SetCookie(cookie)
		return redirectToAuthProxyUrl(c)
	}

	c.Response().Header().Set(echo.HeaderAuthorization, "Bearer "+cookie.Value)
	return c.NoContent(200)
}

func handleSetIDToken(c echo.Context) error {
	rawIDToken := c.QueryParam(ID_TOKEN_QUERY_NAME)
	idToken, err := oidcVerifier.Verify(context.Background(), rawIDToken)

	if err != nil {
		log.Error("jwt verify failed", err)
		return c.String(400, "jwt verify failed")
	}

	cookie := new(http.Cookie)
	cookie.Name = ID_TOKEN_COOKIE_NAME
	cookie.Value = rawIDToken
	cookie.Expires = idToken.Expiry
	cookie.HttpOnly = true
	cookie.SameSite = http.SameSiteLaxMode
	cookie.Path = "/"
	c.SetCookie(cookie)

	uri := c.Request().URL
	params := uri.Query()
	params.Del(ID_TOKEN_QUERY_NAME)
	uri.RawQuery = params.Encode()
	uri.Path = removeExtAuthPathPrefix(uri.Path)

	return c.Redirect(302, uri.String())
}

///////////////////////
// Run as Auth proxy //
///////////////////////

func (h *ApiHandler) handleOIDCLogin(c echo.Context) error {
	if h.getOauth2Config() == nil {
		return c.String(503, "Please configure KALM OIDC environments.")
	}

	// verify request
	originalURL := c.QueryParam("original_url")

	if originalURL == "" {
		return c.String(400, "Require original_url.")
	}

	sign := c.QueryParam("sign")

	if sign == "" {
		return c.String(400, "Require sign.")
	}

	if sign != getStringSignature(originalURL) {
		log.Errorf("Wrong Sign, receive: %s, expected: %s", sign, getStringSignature(originalURL))
		return c.String(400, "Wrong sign")
	}

	state := &OauthState{
		Nonce:       utils.RandString(16),
		OriginalURL: originalURL,
	}

	stateBytes := new(bytes.Buffer)
	err := json.NewEncoder(stateBytes).Encode(state)

	if err != nil {
		return err
	}

	encryptedState, err := utils.AesEncrypt(stateBytes.Bytes(), stateEncryptKey[:])

	if err != nil {
		return err
	}

	return c.Redirect(
		302,
		oauth2Config.AuthCodeURL(
			base64.RawStdEncoding.EncodeToString(encryptedState),
		),
	)
}

// this handler run under dashboard api domain
func (h *ApiHandler) handleOIDCCallback(c echo.Context) error {
	if h.getOauth2Config() == nil {
		return c.String(503, "Please configure KALM OIDC environments.")
	}

	code := c.QueryParam("code")

	stateStr := c.QueryParam("state")

	if stateStr == "" {
		log.Error("Missing state")
		return c.String(400, "Missing state")
	}

	stateBytes, err := base64.RawStdEncoding.DecodeString(stateStr)

	if err != nil {
		log.Error("Base64 decode state failed", err)
		return c.String(400, "Base64 decode state failed")
	}

	stateJsonBytes, err := utils.AesDecrypt(stateBytes, stateEncryptKey[:])

	if err != nil {
		log.Error("Aes decrypted state failed", err)
		return c.String(400, "State mismatch")
	}

	var state OauthState
	err = json.Unmarshal(stateJsonBytes, &state)

	if err != nil {
		log.Errorf("json decode state failed")
		return c.String(400, "json decode state failed")
	}

	oauth2Token, err := oauth2Config.Exchange(
		context.Background(),
		code,
	)

	if err != nil {
		log.Error("Exchange oauth2Token error", err)
		return c.String(400, "Exchange oauth2Token error")
	}

	rawIDToken, ok := oauth2Token.Extra(ID_TOKEN_COOKIE_NAME).(string)

	if !ok {
		log.Error("no id_token in token response")
		return c.String(400, "no id_token in token resonse")
	}

	_, err = oidcVerifier.Verify(context.Background(), rawIDToken)

	if err != nil {
		log.Error("jwt verify failed", err)
		return c.String(400, "jwt verify failed")
	}

	uri, err := url.Parse(state.OriginalURL)

	if err != nil {
		log.Error("parse original url failed. ", state.OriginalURL, err)
		return c.String(400, "parse original url failed.")
	}

	params := uri.Query()
	params.Add(ID_TOKEN_QUERY_NAME, rawIDToken)
	uri.RawQuery = params.Encode()

	return c.Redirect(302, uri.String())
}
