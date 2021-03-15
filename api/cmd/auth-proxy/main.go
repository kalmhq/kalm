package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/coreos/go-oidc"
	"github.com/kalmhq/kalm/api/auth_proxy"
	"github.com/kalmhq/kalm/api/log"
	"github.com/kalmhq/kalm/api/server"
	"github.com/kalmhq/kalm/api/utils"
	"github.com/kalmhq/kalm/controller/controllers"
	"github.com/kalmhq/kalm/controller/validation"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
	"golang.org/x/net/http2"
	"golang.org/x/oauth2"
)

var oauth2Config *oauth2.Config
var oauth2ConfigMut = &sync.Mutex{}

var oidcVerifier *oidc.IDTokenVerifier

var authProxyURL string
var clientSecret string

const KALM_TOKEN_KEY_NAME = "kalm-sso"
const ENVOY_EXT_AUTH_PATH_PREFIX = "ext_authz"

var logger *zap.Logger

var issuerIsGoogle bool
var issuerIsInternalDex bool

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

	// Support for this scope differs between OpenID Connect providers. For instance
	// Google rejects it, favoring appending "access_type=offline" as part of the
	// authorization request instead.
	//
	// See: https://openid.net/specs/openid-connect-core-1_0.html#OfflineAccess
	issuerIsGoogle = oidcProviderUrl == "https://accounts.google.com"
	issuerIsInternalDex = strings.HasSuffix(oidcProviderUrl, "/dex")

	logger.Info(fmt.Sprintf("ClientID: %s", clientID))
	logger.Info(fmt.Sprintf("oidcProviderUrl: %s", oidcProviderUrl))
	logger.Info(fmt.Sprintf("authProxyURL: %s", authProxyURL))

	if clientID == "" || clientSecret == "" || oidcProviderUrl == "" || authProxyURL == "" {
		logger.Debug("KALM OIDC ENVS are not configured")
		return nil
	}

	auth_proxy.InitEncryptKey(sha256.Sum256([]byte(clientSecret)))
	provider, err := oidc.NewProvider(context.Background(), oidcProviderUrl)

	if err != nil {
		logger.Error("KALM new provider failed.", zap.Error(err))
		return nil
	}

	oidcVerifier = provider.Verifier(&oidc.Config{ClientID: clientID})
	var scopes []string

	if issuerIsGoogle {
		scopes = []string{oidc.ScopeOpenID, "profile", "email"}
	} else if issuerIsInternalDex {
		scopes = []string{oidc.ScopeOpenID, "profile", "email", "groups", oidc.ScopeOfflineAccess}
	} else {
		scopes = []string{oidc.ScopeOpenID, "profile", "email", oidc.ScopeOfflineAccess}
	}

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

	// a dirty fix for redirecting to https when access using IP
	var scheme string
	host := c.Request().Host
	isIP := validation.ValidateIPAddress(host) == nil
	if isIP {
		scheme = "http"
	} else {
		scheme = c.Scheme()
	}

	url := fmt.Sprintf("%s://%s%s", scheme, c.Request().Host, requestURI)
	logger.Info(fmt.Sprintf("original url %s", url))
	return url
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
		logger.Debug("parse auth proxy url error.", zap.Error(err))
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

type Claims struct {
	Groups []string `json:"groups"`
	Email  string   `json:"email"`
}

func handleExtAuthz(c echo.Context) error {
	contextLogger := logger.With(zap.String("clientIP", c.RealIP()), zap.String("host", c.Request().Host), zap.String("path", c.Request().URL.Path))
	contextLogger.Info("handleExtAuthz", zap.Bool("tls", c.Request().TLS != nil))

	for k, v := range c.Request().Header {
		contextLogger.Info("handleExtAuthz", zap.String("header", k), zap.Any("value", v))
	}

	// allow traffic to pass (AND semanteme)
	//   - If `let-pass-if-has-bearer-token` header is explicitly declared
	//   - There is a bearerAuthorization token
	if shouldLetPass(c) {
		return c.NoContent(200)
	}

	if getOauth2Config() == nil {
		return c.String(503, "Please configure KALM OIDC environments.")
	}

	if c.QueryParam(KALM_TOKEN_KEY_NAME) != "" {
		thinToken := new(auth_proxy.ThinToken)

		if err := thinToken.Decode(c.QueryParam(KALM_TOKEN_KEY_NAME)); err != nil {
			contextLogger.Info(err.Error())
			return c.String(401, err.Error())
		}

		// only valid if the token is valid.
		// do not check group permission here
		if _, err := oidcVerifier.Verify(context.Background(), thinToken.IDTokenString); err != nil {
			contextLogger.Info(err.Error())
			return c.String(401, err.Error())
		}

		contextLogger.Info("valid jwt token")
		return handleSetIDToken(c)
	}

	token, err := getTokenFromRequest(c)

	if err != nil {
		contextLogger.Info("No auth cookie, redirect to auth proxy")
		return redirectToAuthProxyUrl(c)
	}

	idToken, err := oidcVerifier.Verify(context.Background(), token.IDTokenString)

	if err != nil {
		contextLogger.Debug("verify token error", zap.Error(err))

		// An hack way to know whether the error is expire or not
		if strings.Contains(strings.ToLower(err.Error()), "expire") {

			contextLogger.Debug("enter retry logic", zap.Any("token", token))

			if token.RefreshToken == "" {
				contextLogger.Error("no refresh token")
				clearTokenInCookie(c)
				return c.JSON(401, "The jwt token is invalid, expired, revoked, or was issued to another client. (No refresh token)")
			}

			// use refresh token to fetch the id_token
			idToken, err = refreshIDToken(token)

			if err != nil {
				logger.Error("refresh token error", zap.Error(err))
				clearTokenInCookie(c)
				// return c.JSON(401, "The jwt token is invalid, expired, revoked, or was issued to another client. (After refresh)")
				return redirectToAuthProxyUrl(c)
			}

			encodedToken, _ := token.Encode()

			// ext_authz doesn't allow set response header to client when the auth is successful.
			// Kalm set the new cookie in a payload header, which will be picked up by a envoy filter, and set it into response header to client.
			c.Response().Header().Set(
				controllers.KALM_SSO_SET_COOKIE_PAYLOAD_HEADER,
				newTokenCookie(encodedToken).String(),
			)

			logger.Named("refresh").Info("Set Kalm-Set-Cookie payload.", zap.String("X-Request-Id", c.Request().Header.Get("X-Request-Id")))
		} else {
			clearTokenInCookie(c)
			return c.JSON(401, "The jwt token is invalid, expired, revoked, or was issued to another client.")
		}
	}

	var claims Claims
	_ = idToken.Claims(&claims)

	if !isAuthorized(c, &claims) {
		clearTokenInCookie(c)
		return c.JSON(401, "Access denied. Contact you admin please.")
	}

	// Set user info in meta header
	// if the verify returns no error. It's safe to get claims in this way
	parts := strings.Split(token.IDTokenString, ".")
	c.Response().Header().Set(controllers.KALM_SSO_USERINFO_HEADER, parts[1])
	c.Response().Header().Set(controllers.KALM_AUTH_EMAIL, claims.Email)

	return c.NoContent(200)
}

// When a user's id_token has expired, but the refresh_token is still valid, multiple requests may be received in a short time window.
// But refresh_token is not allowed to be used twice. We can't let all the requests to refresh token at the same time.
// So a condition variable is used to ensure that only one process sends a refresh request,
// and other processes wait for the result. This is enough if there is the auth-proxy service only has one replica.
// If you deploy auth-proxy with scaling, make sure use sticky load balancing strategy.
func refreshIDToken(token *auth_proxy.ThinToken) (idToken *oidc.IDToken, err error) {
	refreshContext, isProducer := auth_proxy.GetRefreshTokenCond(token.RefreshToken)

	if isProducer {
		logger.Named("[refresh producer]").Debug("Do refresh", zap.String("token", token.RefreshToken))
		err = doRefresh(token, refreshContext)
		logger.Named("[refresh producer]").Debug("Done", zap.Error(err))
		auth_proxy.RemoveRefreshTokenCond(token.RefreshToken, 60)
	} else {
		refreshContext.Cond.L.Lock()
		logger.Named("[refresh consumer]").Debug("Wait", zap.String("token", token.RefreshToken))

		for refreshContext.IDToken == nil && refreshContext.Error == nil {
			refreshContext.Cond.Wait()
		}

		err = refreshContext.Error
		logger.Named("[refresh consumer]").Debug("Got result", zap.Error(err))
		refreshContext.Cond.L.Unlock()
	}

	if err != nil {
		return nil, err
	}

	token.IDTokenString = refreshContext.IDTokenString
	token.RefreshToken = refreshContext.RefreshToken

	return refreshContext.IDToken, nil
}

func doRefresh(token *auth_proxy.ThinToken, refreshContext *auth_proxy.RefreshContext) (err error) {
	// Tell other blocked routines the data is ready
	defer func() {
		if err != nil {
			refreshContext.Error = err
		}

		refreshContext.Cond.Broadcast()
	}()

	t := &oauth2.Token{
		RefreshToken: token.RefreshToken,
		Expiry:       time.Now().Add(-time.Hour),
	}

	newOauth2Token, err := oauth2Config.TokenSource(context.Background(), t).Token()

	if err != nil {
		logger.Error("Refresh token error", zap.Error(err))
		return err
	}

	rawIDToken, ok := newOauth2Token.Extra("id_token").(string)

	if !ok {
		return fmt.Errorf("no id_token in refresh token response")
	}

	IDToken, err := oidcVerifier.Verify(context.Background(), rawIDToken)

	if err != nil {
		logger.Error("refreshed token verify error", zap.Error(err))
		return fmt.Errorf("The jwt token is invalid, expired, revoked, or was issued to another client. (After refresh)")
	}

	refreshContext.Cond.L.Lock()
	defer refreshContext.Cond.L.Unlock()

	refreshContext.IDToken = IDToken
	refreshContext.IDTokenString = rawIDToken
	refreshContext.RefreshToken = newOauth2Token.RefreshToken

	return nil
}

func getTokenFromRequest(c echo.Context) (*auth_proxy.ThinToken, error) {
	var tokenString string

	const prefix = "Bearer "

	if strings.HasPrefix(c.Request().Header.Get(echo.HeaderAuthorization), prefix) {
		tokenString = c.Request().Header.Get(echo.HeaderAuthorization)[len(prefix):]
	}

	if tokenString == "" {
		cookie, err := c.Cookie(KALM_TOKEN_KEY_NAME)

		if err != nil {
			return nil, fmt.Errorf("No auth token in cookie")
		}

		if cookie.Value == "" {
			return nil, fmt.Errorf("Auth token in cookie empty")
		}

		tokenString = cookie.Value
	}

	if tokenString == "" {
		return nil, fmt.Errorf("No auth in cookie or authorization header")
	}

	token := new(auth_proxy.ThinToken)

	if err := token.Decode(tokenString); err != nil {
		return nil, err
	}

	return token, nil
}

func shouldLetPass(c echo.Context) bool {
	return c.Request().Header.Get(controllers.KALM_ALLOW_TO_PASS_IF_HAS_BEARER_TOKEN_HEADER) == "true" &&
		strings.HasPrefix(c.Request().Header.Get("Authorization"), "Bearer ")
}

// When auth-proxy works as a ext_authz filter in envoy, the request will come along with
// `kalm-sso-granted-groups` and `kalm-sso-granted-emails`.
// If the `email` in the claims is in `kalm-sso-granted-emails` OR the `groups` in the claims have intersections with `kalm-sso-granted-groups`,
// then the request is considered authorized, otherwise, the request will be blocked.
func isAuthorized(c echo.Context, claims *Claims) bool {
	grantedGroups := c.Request().Header.Get(controllers.KALM_SSO_GRANTED_GROUPS_HEADER)
	grantedEmails := c.Request().Header.Get(controllers.KALM_SSO_GRANTED_EMAILS_HEADER)

	if grantedGroups != "" {
		groups := strings.Split(grantedGroups, "|")

		gm := make(map[string]struct{}, len(groups))
		for _, g := range groups {
			gm[g] = struct{}{}
		}

		for _, g := range claims.Groups {
			if _, ok := gm[g]; ok {
				return true
			}
		}
	}

	if grantedEmails != "" {
		email := strings.ToLower(claims.Email)
		emails := strings.Split(grantedEmails, "|")

		for _, e := range emails {
			if email == e {
				return true
			}
		}
	}

	return false
}

func clearTokenInCookie(c echo.Context) {
	c.SetCookie(&http.Cookie{
		Name:     KALM_TOKEN_KEY_NAME,
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   strings.HasPrefix(authProxyURL, "https"),
		SameSite: http.SameSiteLaxMode,
	})
}

func newTokenCookie(token string) *http.Cookie {
	cookie := new(http.Cookie)
	cookie.Name = KALM_TOKEN_KEY_NAME
	cookie.Expires = time.Now().Add(24 * 7 * time.Hour)
	cookie.HttpOnly = true
	cookie.Secure = strings.HasPrefix(authProxyURL, "https")
	cookie.SameSite = http.SameSiteLaxMode
	cookie.Path = "/"
	cookie.Value = token
	return cookie
}

func handleSetIDToken(c echo.Context) error {
	c.SetCookie(newTokenCookie(c.QueryParam(KALM_TOKEN_KEY_NAME)))

	requestURI := c.Request().Header.Get("X-Envoy-Original-Path")

	logger.Info("set id token", zap.String("X-Envoy-Original-Path", requestURI))

	if requestURI == "" {
		requestURI = removeExtAuthPathPrefix(c.Request().RequestURI)
		logger.Info("set id token", zap.String("RawRequestURI", c.Request().RequestURI), zap.String("removeExtAuthPathPrefix", requestURI))
	}

	uri, err := url.Parse(requestURI)

	if err != nil {
		return err
	}

	params := uri.Query()
	params.Del(KALM_TOKEN_KEY_NAME)
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
		logger.Debug("wrong sign", zap.String("receive", sign), zap.String("expected", getStringSignature(originalURL+now)))
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

	encryptedState, err := auth_proxy.AesEncrypt(stateBytes.Bytes())

	if err != nil {
		return err
	}

	return c.Redirect(
		302,
		getOauth2AuthCodeUrlWithState(encryptedState),
	)
}

func getOauth2AuthCodeUrlWithState(state []byte) string {
	var options []oauth2.AuthCodeOption

	if issuerIsGoogle {
		options = append(options, oauth2.AccessTypeOffline)
	}

	return oauth2Config.AuthCodeURL(
		base64.RawStdEncoding.EncodeToString(state), options...,
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
		logger.Debug("missing state")
		return c.String(400, "Missing state")
	}

	stateBytes, err := base64.RawStdEncoding.DecodeString(stateStr)

	if err != nil {
		logger.Debug("Base64 decode state failed", zap.Error(err))
		return c.String(400, "Base64 decode state failed")
	}

	stateJsonBytes, err := auth_proxy.AesDecrypt(stateBytes)

	if err != nil {
		logger.Debug("Aes decrypted state failed", zap.Error(err))
		return c.String(400, "State mismatch")
	}

	var state OauthState
	err = json.Unmarshal(stateJsonBytes, &state)

	if err != nil {
		logger.Debug("json decode state failed", zap.Error(err))
		return c.String(400, "json decode state failed")
	}

	uri, err := url.Parse(state.OriginalURL)

	if err != nil {
		logger.Debug("parse original url failed.", zap.String("OriginalURL", state.OriginalURL), zap.Error(err))
		return c.String(400, "parse original url failed.")
	}

	oauth2Token, err := oauth2Config.Exchange(
		context.Background(),
		code,
	)

	if err != nil {
		logger.Debug("Exchange oauth2Token error", zap.Error(err))
		return c.String(400, "Exchange oauth2Token error")
	}

	rawIDToken, ok := oauth2Token.Extra("id_token").(string)

	if !ok {
		logger.Debug("no id_token in token response")
		return c.String(400, "no id_token in token response")
	}

	_, err = oidcVerifier.Verify(context.Background(), rawIDToken)

	if err != nil {
		logger.Debug("jwt verify failed", zap.Error(err))
		return c.String(400, "jwt verify failed")
	}

	thinToken := &auth_proxy.ThinToken{
		RefreshToken:  oauth2Token.RefreshToken,
		IDTokenString: rawIDToken,
	}

	encryptedThinToken, err := thinToken.Encode()

	if err != nil {
		logger.Debug("thin token encode error", zap.Error(err))
		return c.String(400, err.Error())
	}

	params := uri.Query()
	params.Add(KALM_TOKEN_KEY_NAME, encryptedThinToken)
	uri.RawQuery = params.Encode()

	return c.Redirect(302, uri.String())
}

type LogoutRes struct {
	EndSessionEndpoint string `json:"endSessionEndpoint"`
}

func handleOIDCLogout(c echo.Context) error {
	if getOauth2Config() == nil {
		return c.String(503, "Please configure KALM OIDC environments.")
	}

	clearTokenInCookie(c)

	endSessionEndpoint := os.Getenv("KALM_OIDC_PROVIDER_URL") + "/session/end"

	return c.JSON(205, &LogoutRes{endSessionEndpoint})
}

func handleLog(c echo.Context) error {
	verbose := c.QueryParam("verbose")

	var verb bool

	if verbose != "" {
		verb = true
	} else {
		verb = false
	}

	logger = log.NewLogger(verb)

	return c.String(200, fmt.Sprintf("verbose: %t", verb))
}

func main() {
	logger = log.NewLogger(false)
	e := server.NewEchoInstance()

	// oidc auth proxy handlers
	e.GET("/oidc/login", handleOIDCLogin)
	e.GET("/oidc/callback", handleOIDCCallback)

	// envoy ext_authz handlers
	e.Any("/"+ENVOY_EXT_AUTH_PATH_PREFIX+"/*", handleExtAuthz)
	e.Any("/"+ENVOY_EXT_AUTH_PATH_PREFIX, handleExtAuthz)
	e.Any("/"+ENVOY_EXT_AUTH_PATH_PREFIX+"/oidc/logout", handleOIDCLogout)

	e.POST("/log", handleLog)

	err := e.StartH2CServer("0.0.0.0:3002", &http2.Server{
		MaxConcurrentStreams: 250,
		MaxReadFrameSize:     1048576,
		IdleTimeout:          60 * time.Second,
	})

	if err != nil {
		panic(err)
	}
}
