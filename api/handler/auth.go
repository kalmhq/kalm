package handler

import (
	"github.com/kalmhq/kalm/api/client"
	"net/http"

	"github.com/kalmhq/kalm/api/auth"
	"github.com/labstack/echo/v4"
	"k8s.io/client-go/kubernetes"
)

type LoginStatusResponse struct {
	Authorized bool `json:"authorized"`
	// deprecated
	Entity        string   `json:"entity"`
	Email         string   `json:"email"`
	Groups        []string `json:"groups"`
	Impersonation string   `json:"impersonation"`
	Policies      string   `json:"policies"`
}

func (h *ApiHandler) handleValidateToken(c echo.Context) error {
	token := auth.ExtractTokenFromHeader(c.Request().Header.Get(echo.HeaderAuthorization))

	_, err := h.clientManager.GetClientInfoFromToken(token, "")

	if err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}

// This handler is for frontend to know if it's authorized.
// The kalm api server may be behind some proxies that will provide auth info for the client.
func (h *ApiHandler) handleLoginStatus(c echo.Context) error {
	clientInfo, err := h.clientManager.GetConfigForClientRequestContext(c)

	var res LoginStatusResponse

	if err != nil {
		return c.JSON(http.StatusOK, res)
	}

	if clientInfo != nil {
		k8sClient, err := kubernetes.NewForConfig(clientInfo.Cfg)

		if err != nil {
			return c.JSON(http.StatusOK, res)
		}

		_, err = k8sClient.ServerVersion()

		if err != nil {
			return c.JSON(http.StatusOK, res)
		}

		res.Entity = clientInfo.Email
		res.Email = clientInfo.Email
		res.Groups = clientInfo.Groups
		res.Authorized = true

		var subjects []string
		if clientInfo.Impersonation == "" {
			subjects = make([]string, len(clientInfo.Groups)+1)
			subjects[0] = client.ToSafeSubject(clientInfo.Email)

			for i, role := range clientInfo.Groups {
				subjects[i+1] = client.ToSafeSubject(role)
			}
		} else {
			res.Impersonation = clientInfo.Impersonation
			subjects = []string{client.ToSafeSubject(clientInfo.Impersonation)}
		}

		res.Policies = h.clientManager.GetRBACEnforcer().GetCompletePoliciesFor(subjects...)
	}

	return c.JSON(http.StatusOK, res)
}
