package handler

import (
	"github.com/kapp-staging/kapp/controller/controllers"
	"github.com/labstack/echo/v4"
	v1 "k8s.io/api/storage/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"sort"
	"strings"
)

type StorageClass struct {
	Name      string `json:"name"`
	IsManaged bool   `json:"isManaged"`
	DocLink   string `json:"docLink"`
	PriceLink string `json:"priceLink"`

	//deprecated
	IsKappManaged bool `json:"isKappManaged"`
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

		docLink, priceLink := getDocAndPriceLink(sc)

		scList = append(scList, StorageClass{
			Name:          sc.Name,
			IsKappManaged: isKappManagedStorageClass(sc),
			IsManaged:     isKappManagedStorageClass(sc),
			DocLink:       docLink,
			PriceLink:     priceLink,
		})
	}

	sort.Slice(scList, func(i, j int) bool {
		a := scList[i]
		b := scList[j]

		if a.IsManaged && b.IsManaged {
			return strings.Compare(a.Name, b.Name) <= 0
		} else {
			return a.IsManaged
		}
	})

	return c.JSON(200, scList)
}

func isKappManagedStorageClass(sc v1.StorageClass) bool {
	if _, exist := sc.Labels[controllers.KappLabelManaged]; exist {
		return true
	}

	return false
}

func getDocAndPriceLink(sc v1.StorageClass) (docLink string, priceLink string) {
	if sc.Annotations == nil {
		return
	}

	docLink = sc.Annotations[controllers.KappAnnoSCDocLink]
	priceLink = sc.Annotations[controllers.KappAnnoSCPriceLink]

	return
}
