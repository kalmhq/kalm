package errors

import (
	"github.com/kalmhq/kalm/api/log"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
)

type ErrorRes struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Errors  []ErrDetail `json:"errors"`
}

type ErrDetail struct {
	Key     string `json:"key"`
	Message string `json:"message"`
}

func CustomHTTPErrorHandler(err error, c echo.Context) {
	log.Debug("return error message to client", "err", err)

	statusError, ok := err.(*errors.StatusError)
	if ok && statusError.Status().Code > 0 {
		c.JSON(int(statusError.ErrStatus.Code), &ErrorRes{Status: statusError.ErrStatus.Status, Message: statusError.ErrStatus.Message})
		return
	}

	if validateErrList, ok := err.(v1alpha1.KalmValidateErrorList); ok {
		code := http.StatusBadRequest

		var errs []ErrDetail
		for _, e := range validateErrList {
			errs = append(errs, ErrDetail{
				Key:     e.Path,
				Message: e.Err,
			})
		}

		c.JSON(code, &ErrorRes{
			Status:  metav1.StatusFailure,
			Message: "validation error",
			Errors:  errs,
		})

		return
	}

	code := http.StatusInternalServerError
	message := err.Error()
	if httpError, ok := err.(*echo.HTTPError); ok {
		code = httpError.Code
		message = httpError.Message.(string)
	}

	if !c.Response().Committed {
		c.JSON(code, &ErrorRes{Status: metav1.StatusFailure, Message: message})
	}
}
