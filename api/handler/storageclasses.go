package handler

import (
	"sort"
	"strings"

	"github.com/kalmhq/kalm/controller/controllers"
	"github.com/labstack/echo/v4"
	v1 "k8s.io/api/storage/v1"
	"k8s.io/apimachinery/pkg/api/errors"
)

type StorageClass struct {
	Name      string `json:"name"`
	IsManaged bool   `json:"isManaged"`
	DocLink   string `json:"docLink"`
	PriceLink string `json:"priceLink"`

	//deprecated
	IsKalmManaged bool `json:"isKalmManaged"`
}

func (h *ApiHandler) handleListStorageClasses(c echo.Context) error {
	h.MustCanView(getCurrentUser(c), "*", "storageClasses/*")

	var storageClassList v1.StorageClassList

	if err := h.resourceManager.List(&storageClassList); err != nil {
		if !errors.IsNotFound(err) {
			return err
		}
	}

	var scList []StorageClass
	for _, sc := range storageClassList.Items {

		docLink, priceLink := getDocAndPriceLink(sc)

		scList = append(scList, StorageClass{
			Name:          sc.Name,
			IsKalmManaged: isKalmManagedStorageClass(sc),
			IsManaged:     isKalmManagedStorageClass(sc),
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

func isKalmManagedStorageClass(sc v1.StorageClass) bool {
	if _, exist := sc.Labels[controllers.KalmLabelManaged]; exist {
		return true
	}

	return false
}

func getDocAndPriceLink(sc v1.StorageClass) (docLink string, priceLink string) {
	if sc.Annotations == nil {
		return
	}

	docLink = sc.Annotations[controllers.KalmAnnoSCDocLink]
	priceLink = sc.Annotations[controllers.KalmAnnoSCPriceLink]

	return
}
