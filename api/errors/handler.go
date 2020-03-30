package errors

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type ErrorRes struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

func CustomHTTPErrorHandler(err error, c echo.Context) {
	c.Logger().Error(err)

	statusError, ok := err.(*errors.StatusError)

	if ok && statusError.Status().Code > 0 {
		c.JSON(int(statusError.ErrStatus.Code), &ErrorRes{Status: statusError.ErrStatus.Status, Message: statusError.ErrStatus.Message})
		return
	}

	code := http.StatusInternalServerError
	if httpError, ok := err.(*echo.HTTPError); ok {
		code = httpError.Code
	}

	if !c.Response().Committed {
		c.JSON(code, &ErrorRes{Status: metav1.StatusFailure, Message: err.Error()})
	}
}
