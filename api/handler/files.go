package handler

import (
	"fmt"
	"net/http"

	"github.com/kapp-staging/kapp/lib/files"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// TODO validate path

func (h *ApiHandler) findOrCreateKappConfigMap(c echo.Context) (*coreV1.ConfigMap, error) {
	k8sClient := getK8sClient(c)
	namespace := c.Param("namespace")

	configMap, err := k8sClient.CoreV1().ConfigMaps(namespace).Get(files.KAPP_CONFIG_MAP_NAME, metaV1.GetOptions{TypeMeta: metaV1.TypeMeta{
		Kind:       "ConfigMap",
		APIVersion: "coreV1",
	}})

	if errors.IsNotFound(err) {
		configMap, err = k8sClient.CoreV1().ConfigMaps(namespace).Create(&coreV1.ConfigMap{
			ObjectMeta: metaV1.ObjectMeta{
				Name:      files.KAPP_CONFIG_MAP_NAME,
				Namespace: namespace,
			},
			Data: map[string]string{
				files.KAPP_SLASH_REPLACER: files.KAPP_PERSISTENT_DIR_PLACEHOLDER,
			},
		})

		if err != nil {
			log.Error("create kapp config map error", err)
			return nil, err
		}

	} else if _, ok := configMap.Data[files.KAPP_SLASH_REPLACER]; !ok {
		if err := files.AddFile(configMap, &files.File{
			Path:    "/",
			IsDir:   true,
			Content: "",
		}); err != nil {
			return nil, err
		}

		if err := h.UpdateConfigMap(c, configMap); err != nil {
			return nil, err
		}

	} else if err != nil {
		log.Error("get kapp config map error", err)
		return nil, err
	}

	return configMap, nil
}

func (h *ApiHandler) UpdateConfigMap(c echo.Context, configMap *coreV1.ConfigMap) error {
	k8sClient := getK8sClient(c)
	namespace := c.Param("namespace")
	_, err := k8sClient.CoreV1().ConfigMaps(namespace).Update(configMap)

	if err != nil {
		log.Error("update config-map error", err)
	}

	return err
}

// Api Handlers

type FilesCreateRequest struct {
	Files []files.File `json:"files"`
	File  files.File   `json:"file"`
}

func (h *ApiHandler) handleCreateFile(c echo.Context) (err error) {
	var req FilesCreateRequest

	if err = c.Bind(&req); err != nil {
		return err
	}

	configMap, err := h.findOrCreateKappConfigMap(c)

	if err != nil {
		return err
	}

	var tmpFiles []files.File
	if len(req.Files) > 0 {
		tmpFiles = req.Files
	} else {
		tmpFiles = append(tmpFiles, req.File)
	}

	for _, tmpFile := range tmpFiles {
		if err := files.AddFile(configMap, &tmpFile); err != nil {
			return err
		}
	}

	if err := h.UpdateConfigMap(c, configMap); err != nil {
		return err
	}

	return c.NoContent(http.StatusCreated)
}

func (h *ApiHandler) handleUpdateFile(c echo.Context) error {
	var file files.File

	err := c.Bind(&file)

	if err != nil {
		log.Error("bind file error", err)
		return err
	}

	if file.IsDir {
		err := fmt.Errorf("Can't update dir")
		return err
	}

	configMap, err := h.findOrCreateKappConfigMap(c)

	if err != nil {
		return err
	}

	if err := files.UpdateFile(configMap, &file); err != nil {
		return err
	}

	if err := h.UpdateConfigMap(c, configMap); err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}

type MoveFileRequest struct {
	OldPath string `json:"oldPath"`
	NewPath string `json:"newPath"`
}

func (h *ApiHandler) handleMoveFile(c echo.Context) error {
	var req MoveFileRequest

	err := c.Bind(&req)

	if err != nil {
		log.Error("bind file error", err)
		return err
	}

	configMap, err := h.findOrCreateKappConfigMap(c)

	if err != nil {
		return err
	}

	root, err := files.GetFileItemTree(configMap, req.OldPath)

	if err != nil {
		log.Error(err)
		return err
	}

	if err := files.MoveFile(configMap, root, req.NewPath); err != nil {
		return err
	}

	files.CleanUpConfigMap(configMap)

	if err := h.UpdateConfigMap(c, configMap); err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}

func (h *ApiHandler) handleDeleteFile(c echo.Context) error {
	var file files.File

	err := c.Bind(&file)

	if err != nil {
		log.Error("bind file error", err)
		return err
	}

	configMap, err := h.findOrCreateKappConfigMap(c)

	if err != nil {
		return err
	}

	if file.Path == "/" {
		err := fmt.Errorf("Can't delete root path")
		return err
	}

	if err := files.DeleteFile(configMap, &file); err != nil {
		return err
	}

	files.CleanUpConfigMap(configMap)

	if err := h.UpdateConfigMap(c, configMap); err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}

func (h *ApiHandler) handleListFiles(c echo.Context) error {
	configMap, err := h.findOrCreateKappConfigMap(c)

	if err != nil {
		return err
	}

	if root, err := files.GetFileItemTree(configMap, "/"); err != nil {
		return err
	} else {
		return c.JSON(http.StatusOK, root)
	}
}
