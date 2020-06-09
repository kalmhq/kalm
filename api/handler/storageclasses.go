package handler

import (
	"github.com/kapp-staging/kapp/controller/controllers"
	"github.com/labstack/echo/v4"
	v1 "k8s.io/api/storage/v1"
	"k8s.io/apimachinery/pkg/api/errors"
)

type StorageClass struct {
	Name          string `json:"name"`
	IsKappManaged bool   `json:"isKappManaged"`
}

func (h *ApiHandler) handleListStorageClasses(c echo.Context) error {
	builder := h.Builder(c)

	var storageClassList v1.StorageClassList
	if err := builder.List(&storageClassList); err != nil {
		if !errors.IsNotFound(err) {
			return err
		}
	}

	var scList []StorageClass
	for _, sc := range storageClassList.Items {
		scList = append(scList, StorageClass{
			Name:          sc.Name,
			IsKappManaged: isKappManagedStorageClass(sc),
		})
	}

	return c.JSON(200, scList)
}

func isKappManagedStorageClass(sc v1.StorageClass) bool {
	if _, exist := sc.Labels[controllers.KappManagedLabelName]; exist {
		return true
	}

	return false
}
