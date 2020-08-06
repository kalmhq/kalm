package main

import (
	"bytes"
	"context"
	"crypto/md5"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/coreos/go-oidc"
	"github.com/kalmhq/kalm/api/server"
	"github.com/kalmhq/kalm/api/utils"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
	"golang.org/x/net/http2"
	"golang.org/x/oauth2"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

var oauth2Config *oauth2.Config
var oauth2ConfigMut = &sync.Mutex{}

var stateEncryptKey [16]byte
var oidcVerifier *oidc.IDTokenVerifier

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

func getOauth2Config() *oauth2.Config {
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
	authProxyURL = os.Getenv("KALM_OIDC_AUTH_PROXY_URL")

	if clientID == "" || clientSecret == "" || oidcProviderUrl == "" || authProxyURL == "" {
		log.Error("KALM OIDC ENVs are not configured.")
		return nil
	}

	stateEncryptKey = md5.Sum([]byte(clientSecret))
	provider, err := oidc.NewProvider(context.Background(), oidcProviderUrl)

	if err != nil {
		log.Error("KALM new provider failed.")
		return nil
	}

	oidcVerifier = provider.Verifier(&oidc.Config{ClientID: clientID})

	scopes := []string{}
	scopes = append(scopes, oidc.ScopeOpenID, "profile", "email", "groups")

	oauth2Config = &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Endpoint:     provider.Endpoint(),
		Scopes:       scopes,
		RedirectURL:  authProxyURL + "/oidc/callback",
	}

	return oauth2Config
}

func removeExtAuthPathPrefix(path string) string {
	if strings.HasPrefix(path, "/"+ENVOY_EXT_AUTH_PATH_PREFIX) {
		// remove prefix "/" + ENVOY_EXT_AUTH_PATH_PREFIX
		path = path[len(ENVOY_EXT_AUTH_PATH_PREFIX)+1:]
	}

	return path
}

func getOriginalURL(c echo.Context) string {
	// If the request is rewrite at route level, use the original path
	requestURI := c.Request().Header.Get("X-Envoy-Original-Path")

	if requestURI == "" {
		requestURI = removeExtAuthPathPrefix(c.Request().RequestURI)
	}

	if requestURI == "" {
		requestURI = "/"
	}

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
	uri, err := url.Parse(authProxyURL + "/oidc/login")

	if err != nil {
		log.Error("parse auth proxy url error.", err)
		return err
	}

	now := strconv.FormatInt(time.Now().UTC().UnixNano(), 10)
	params := uri.Query()
	params.Add("original_url", originalURL)
	params.Add("now", now)
	params.Add("sign", getStringSignature(originalURL+now))

	uri.RawQuery = params.Encode()

	return c.Redirect(302, uri.String())
}

///////////////////////////////////
// Run as Envoy ext_authz filter //
///////////////////////////////////

type ClaimsWithGroups struct {
	Groups []string `json:"groups"`
}

func handleExtAuthz(c echo.Context) error {
	logger := log.WithFields(log.Fields{
		"clientIP": c.RealIP(),
		"host":     c.Request().Host,
		"path":     c.Request().URL.Path,
	})

	if getOauth2Config() == nil {
		return c.String(503, "Please configure KALM OIDC environments.")
	}

	if c.QueryParam(ID_TOKEN_QUERY_NAME) != "" {
		if idToken, err := checkJwtToken(c, c.QueryParam(ID_TOKEN_QUERY_NAME)); err != nil {
			logger.Info(err.Error())
			return c.String(401, err.Error())
		} else {
			logger.Info("valid jwt token")
			return handleSetIDToken(c, idToken, c.QueryParam(ID_TOKEN_QUERY_NAME))
		}
	}

	token, err := getTokenFromRequest(c)

	if err != nil {
		logger.Info(err.Error())
		return redirectToAuthProxyUrl(c)
	}

	if token == "" {
		return redirectToAuthProxyUrl(c)
	}

	_, err = checkJwtToken(c, token)

	if err != nil {
		return c.String(401, err.Error())
	}

	// if the verify returns no error. It's safe to get claims in this way
	parts := strings.Split(token, ".")
	c.Response().Header().Set("kalm-sso-userinfo", parts[1])

	return c.NoContent(200)
}

func getTokenFromRequest(c echo.Context) (string, error) {
	var token string

	const prefix = "Bearer "

	if strings.HasPrefix(c.Request().Header.Get(echo.HeaderAuthorization), prefix) {
		token = c.Request().Header.Get(echo.HeaderAuthorization)[len(prefix):]
	}

	if token == "" {
		cookie, err := c.Cookie(ID_TOKEN_COOKIE_NAME)

		if err != nil {
			return "", fmt.Errorf("No auth cookie, redirect to auth proxy")
		}

		if cookie.Value == "" {
			return "", fmt.Errorf("Auth cookie value empty, redirect to auth proxy")
		}

		token = cookie.Value
	}

	return token, nil
}

func checkJwtToken(c echo.Context, token string) (*oidc.IDToken, error) {
	idToken, err := oidcVerifier.Verify(context.Background(), token)

	if err != nil {
		// clear cookie
		c.SetCookie(&http.Cookie{
			Name:     ID_TOKEN_COOKIE_NAME,
			Value:    "",
			Path:     "/",
			Expires:  time.Unix(0, 0),
			HttpOnly: true,
		})

		return nil, fmt.Errorf("The jwt token is invalid, expired, revoked, or was issued to another client.")
	}

	if !inGrantedGroups(c, idToken) {
		// clear cookie
		c.SetCookie(&http.Cookie{
			Name:     ID_TOKEN_COOKIE_NAME,
			Value:    "",
			Path:     "/",
			Expires:  time.Unix(0, 0),
			HttpOnly: true,
		})

		return nil, fmt.Errorf("You don't in any granted groups. Contact you admin please.")
	}

	return idToken, nil
}

func inGrantedGroups(c echo.Context, idToken *oidc.IDToken) bool {
	grantedGroups := c.Request().Header.Get("Kalm-Sso-Granted-Groups")

	if grantedGroups == "" {
		return true
	}

	groups := strings.Split(grantedGroups, "|")
	var claim ClaimsWithGroups
	_ = idToken.Claims(&claim)

	gm := make(map[string]struct{}, len(groups))
	for _, g := range groups {
		gm[g] = struct{}{}
	}

	for _, g := range claim.Groups {
		if _, ok := gm[g]; ok {
			return true
		}
	}

	return false
}

func handleSetIDToken(c echo.Context, idToken *oidc.IDToken, rawIDToken string) error {
	cookie := new(http.Cookie)
	cookie.Name = ID_TOKEN_COOKIE_NAME
	cookie.Value = rawIDToken

	cookie.Expires = time.Now().Add(5 * time.Minute)

	if idToken.Expiry.Before(cookie.Expires) {
		cookie.Expires = idToken.Expiry
	}

	cookie.HttpOnly = true
	cookie.SameSite = http.SameSiteLaxMode
	cookie.Path = "/"
	c.SetCookie(cookie)

	requestURI := c.Request().Header.Get("X-Envoy-Original-Path")

	log.Debugf("[Set ID Token] X-Envoy-Original-Path: %s", requestURI)

	if requestURI == "" {
		requestURI = removeExtAuthPathPrefix(c.Request().RequestURI)
		log.Debugf("[Set ID Token] RawRequestURI: %s,  removeExtAuthPathPrefix: %s", c.Request().RequestURI, requestURI)
	}

	uri, err := url.Parse(requestURI)

	if err != nil {
		return err
	}

	params := uri.Query()
	params.Del(ID_TOKEN_QUERY_NAME)
	uri.RawQuery = params.Encode()

	if uri.Path == "" {
		uri.Path = "/"
	}

	return c.Redirect(302, uri.String())
}

///////////////////////
// Run as Auth proxy //
///////////////////////

func handleOIDCLogin(c echo.Context) error {
	if getOauth2Config() == nil {
		return c.String(503, "Please configure KALM OIDC environments.")
	}

	// verify request
	originalURL := c.QueryParam("original_url")
	now := c.QueryParam("now")

	if originalURL == "" {
		return c.String(400, "Require param original_url.")
	}

	if now == "" {
		return c.String(400, "Require param original_url.")
	}

	sign := c.QueryParam("sign")

	if sign == "" {
		return c.String(400, "Require sign.")
	}

	if sign != getStringSignature(originalURL+now) {
		log.Errorf("Wrong Sign, receive: %s, expected: %s", sign, getStringSignature(originalURL+now))
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
func handleOIDCCallback(c echo.Context) error {
	if getOauth2Config() == nil {
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

func handleLog(c echo.Context) error {
	level := c.QueryParam("level")

	switch level {
	case "debug":
		log.SetLevel(log.DebugLevel)
	default:
		log.SetLevel(log.InfoLevel)
	}

	return c.NoContent(200)
}

func main() {
	e := server.NewEchoInstance()

	// oidc auth proxy handlers
	e.GET("/oidc/login", handleOIDCLogin)
	e.GET("/oidc/callback", handleOIDCCallback)

	// envoy ext_authz handlers
	e.GET("/"+ENVOY_EXT_AUTH_PATH_PREFIX+"/*", handleExtAuthz)
	e.GET("/"+ENVOY_EXT_AUTH_PATH_PREFIX, handleExtAuthz)

	e.POST("/log", handleLog)

	e.Logger.Fatal(e.StartH2CServer("0.0.0.0:3002", &http2.Server{
		MaxConcurrentStreams: 250,
		MaxReadFrameSize:     1048576,
		IdleTimeout:          60 * time.Second,
	}))
}
