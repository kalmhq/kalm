package handler

import "github.com/labstack/echo/v4"

func (h *ApiHandler) handleGetDependencies(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/dependencies").DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

// TODO list support dependencies
func (h *ApiHandler) handleGetAvailableDependencies(c echo.Context) error {
	return c.JSON(200, H{
		"dependencies": []string{},
	})
}
