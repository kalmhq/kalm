package handler

import "github.com/labstack/echo/v4"

func (h *ApiHandler) handleGetFiles(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Get().AbsPath("/apis/core.kapp.dev/v1alpha1/namespaces/default/files").DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleCreateFile(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Post().Body(c.Request().Body).AbsPath("/apis/core.kapp.dev/v1alpha1/namespaces/default/files").DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleUpdateFile(c echo.Context) error {
	k8sClient := getK8sClient(c)

	res, err := k8sClient.RESTClient().Put().Body(c.Request().Body).AbsPath("/apis/core.kapp.dev/v1alpha1/namespaces/default/files/" + c.Param("name")).DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}

func (h *ApiHandler) handleDeleteFile(c echo.Context) error {
	k8sClient := getK8sClient(c)
	res, err := k8sClient.RESTClient().Delete().AbsPath("/apis/core.kapp.dev/v1alpha1/namespaces/default/files/" + c.Param("name")).DoRaw()

	if err != nil {
		return err
	}

	return c.JSONBlob(200, res)
}
