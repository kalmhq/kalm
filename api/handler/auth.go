package handler

import (
	"github.com/kalmhq/kalm/api/resources"
	"net/http"

	"github.com/dgrijalva/jwt-go"
	"github.com/kalmhq/kalm/api/auth"
	"github.com/labstack/echo/v4"
	authorizationV1 "k8s.io/api/authorization/v1"
	"k8s.io/client-go/kubernetes"
)

type LoginStatusResponse struct {
	Authorized bool   `json:"authorized"`
	IsAdmin    bool   `json:"isAdmin"`
	Entity     string `json:"entity"`
	CSRF       string `json:"csrf"`
}

func (h *ApiHandler) handleValidateToken(c echo.Context) error {
	authInfo, err := auth.GetAuthInfo(c)
	if err != nil {
		return err
	}
	err = h.clientManager.IsAuthInfoWorking(authInfo)
	if err != nil {
		return err
	}
	return c.NoContent(http.StatusOK)
}

func (h *ApiHandler) handleLoginStatus(c echo.Context) error {
	clientConfig, err := h.clientManager.GetClientConfig(c)

	var res LoginStatusResponse

	if err != nil {
		return c.JSON(http.StatusOK, res)
	}

	k8sClient, err := kubernetes.NewForConfig(clientConfig)
	if err != nil {
		return c.JSON(http.StatusOK, res)
	}

	_, err = k8sClient.ServerVersion()

	if err != nil {
		return c.JSON(http.StatusOK, res)
	}

	res.Authorized = true

	review := &authorizationV1.SelfSubjectAccessReview{
		Spec: authorizationV1.SelfSubjectAccessReviewSpec{
			ResourceAttributes: &authorizationV1.ResourceAttributes{
				Namespace: "",
				Resource:  "clusterrolebindings",
				Verb:      "create",
			},
		},
	}

	builder := resources.NewBuilder(k8sClient, clientConfig, h.logger)

	// If the user can create clusterrolebinding, the user is an admin.
	err = builder.Create(review)

	if err != nil {
		return err
	}

	entity := tryToParseEntityFromToken(auth.ExtractTokenFromHeader(c.Request().Header.Get(echo.HeaderAuthorization)))
	res.IsAdmin = review.Status.Allowed
	res.Entity = entity
	//res.CSRF = c.Get(middleware.DefaultCSRFConfig.ContextKey).(string)

	return c.JSON(http.StatusOK, res)
}

// Since the token is validated by api server, so we don't need to valid the token again here.
func tryToParseEntityFromToken(tokenString string) string {
	if tokenString == "" {
		return "unknown"
	}

	token, _, err := new(jwt.Parser).ParseUnverified(tokenString, jwt.MapClaims{})

	if err != nil {
		return "token"
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		return claims["sub"].(string)
	}

	return "token"
}
