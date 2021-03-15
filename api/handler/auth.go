package handler

import (
	"crypto/md5"
	"fmt"
	"net/http"
	"strings"

	"github.com/kalmhq/kalm/api/auth"
	"github.com/kalmhq/kalm/api/client"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
)

type LoginStatusResponse struct {
	Authorized        bool     `json:"authorized"`
	AvatarURL         string   `json:"avatarUrl"`
	Email             string   `json:"email"`
	Groups            []string `json:"groups"`
	Impersonation     string   `json:"impersonation"`
	ImpersonationType string   `json:"impersonationType"`
	Policies          string   `json:"policies"`
}

func (h *ApiHandler) handleValidateToken(c echo.Context) error {
	token := auth.ExtractTokenFromHeader(c.Request().Header.Get(echo.HeaderAuthorization))

	_, err := h.clientManager.GetClientInfoFromToken(token)
	if err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}

// This handler is for frontend to know if it's authorized.
// The kalm api server may be behind some proxies that will provide auth info for the client.
func (h *ApiHandler) handleLoginStatus(c echo.Context) error {
	clientInfo, err := h.clientManager.GetClientInfoFromContext(c)

	var res LoginStatusResponse

	if err != nil || clientInfo == nil {
		return c.JSON(http.StatusOK, res)
	}

	res.Email = clientInfo.Email
	res.Groups = clientInfo.Groups
	res.Authorized = true

	var subjects []string
	if clientInfo.Impersonation == "" {
		subjects = make([]string, len(clientInfo.Groups)+1)
		subjects[0] = client.ToSafeSubject(clientInfo.Email, v1alpha1.SubjectTypeUser)

		for i, role := range clientInfo.Groups {
			subjects[i+1] = client.ToSafeSubject(role, v1alpha1.SubjectTypeGroup)
		}
	} else {
		res.Impersonation = clientInfo.Impersonation
		res.ImpersonationType = clientInfo.ImpersonationType
		subjects = []string{client.ToSafeSubject(clientInfo.Impersonation, clientInfo.ImpersonationType)}
	}

	res.Policies = h.clientManager.GetRBACEnforcer().GetCompletePoliciesFor(subjects...)

	var avatarEmail string
	if strings.Contains(res.Impersonation, "@") {
		avatarEmail = res.Impersonation
	} else if strings.Contains(res.Email, "@") {
		avatarEmail = res.Email
	}

	if avatarEmail != "" {
		// gavatar hash https://en.gravatar.com/site/implement/hash/
		emailMD5 := md5.Sum([]byte(strings.ToLower(strings.TrimSpace(avatarEmail))))
		res.AvatarURL = fmt.Sprintf("https://www.gravatar.com/avatar/%x", emailMD5[:])
	}

	return c.JSON(http.StatusOK, res)
}
