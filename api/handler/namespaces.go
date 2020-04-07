package handler

import (
	"fmt"
	"github.com/labstack/echo/v4"
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
	"strings"
)

type Namespace struct {
	Name string `json:"name"`
}

type NamespaceListResponse struct {
	Namespaces []Namespace `json:"namespaces"`
}

func (h *ApiHandler) handleListNamespaces(c echo.Context) error {
	k8sClient := getK8sClient(c)

	ns, err := k8sClient.CoreV1().Namespaces().List(ListAll)

	if err != nil {
		return err
	}

	res := NamespaceListResponse{
		Namespaces: make([]Namespace, 0),
	}

	for _, ns := range ns.Items {
		// only return kapp namespaces
		if !strings.HasPrefix(ns.Name, "kapp-") {
			continue
		}

		if ns.DeletionTimestamp != nil {
			continue
		}

		res.Namespaces = append(res.Namespaces, Namespace{
			Name: ns.Name,
		})
	}

	return c.JSON(http.StatusOK, res)
}

func formatNamespaceName(name string) string {
	if strings.HasPrefix(name, "kapp-") {
		name = strings.ReplaceAll(name, "kapp-", "")
	}
	return fmt.Sprintf("kapp-%s", name)
}

func (h *ApiHandler) handleCreateNamespace(c echo.Context) error {
	k8sClient := getK8sClient(c)

	namespace := &coreV1.Namespace{
		ObjectMeta: metaV1.ObjectMeta{
			Name: formatNamespaceName(c.Param("name")),
		},
	}
	namespace, err := k8sClient.CoreV1().Namespaces().Create(namespace)

	if err != nil {
		return err
	}

	return c.NoContent(http.StatusCreated)
}

func (h *ApiHandler) handleDeleteNamespace(c echo.Context) error {
	err := getK8sClient(c).CoreV1().Namespaces().Delete(formatNamespaceName(c.Param("name")), nil)

	if err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}
