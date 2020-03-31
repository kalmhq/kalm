package handler

import (
	"fmt"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
	"sort"
	"strings"
)

type File struct {
	Path    string `json:"path"`
	IsDir   bool   `json:"isDir"`
	Content string `json:"content"`
}

// TODO validate path

// will use this a config-map called kapp-files to store files in each namespace
const KAPP_CONFIG_MAP_NAME = "kapp-files"

// auto-generated dir
const KAPP_DIR_PLACEHOLDER = "__DIR__"

// user created dir
const KAPP_PERSISTENT_DIR_PLACEHOLDER = "__PDIR__"

// config map key can't include "/", use this replace "/" in key
const KAPP_SLASH_REPLACER = "__D__"

// Handler Helper Functions

func (h *ApiHandler) findOrCreateKappConfigMap(c echo.Context) (*coreV1.ConfigMap, error) {
	k8sClient := getK8sClient(c)
	namespace := c.Param("namespace")

	configMap, err := k8sClient.CoreV1().ConfigMaps(namespace).Get(KAPP_CONFIG_MAP_NAME, metaV1.GetOptions{TypeMeta: metaV1.TypeMeta{
		Kind:       "ConfigMap",
		APIVersion: "coreV1",
	}})

	if errors.IsNotFound(err) {
		configMap, err = k8sClient.CoreV1().ConfigMaps(namespace).Create(&coreV1.ConfigMap{
			ObjectMeta: metaV1.ObjectMeta{
				Name:      KAPP_CONFIG_MAP_NAME,
				Namespace: namespace,
			},
			Data: map[string]string{
				KAPP_SLASH_REPLACER: KAPP_PERSISTENT_DIR_PLACEHOLDER,
			},
		})

		if err != nil {
			log.Error("create kapp config map error", err)
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

func (h *ApiHandler) handleCreateFile(c echo.Context) (err error) {
	var file File

	if err = c.Bind(&file); err != nil {
		log.Error("bind file error", err)
		return err
	}

	configMap, err := h.findOrCreateKappConfigMap(c)

	if err != nil {
		return err
	}

	if err := addFile(configMap, &file); err != nil {
		return err
	}

	if err := h.UpdateConfigMap(c, configMap); err != nil {
		return err
	}

	return c.NoContent(http.StatusCreated)
}

func (h *ApiHandler) handleUpdateFile(c echo.Context) error {
	var file File

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

	if err := updateFile(configMap, &file); err != nil {
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

	root, err := getFileItemTree(configMap, req.OldPath)

	if err != nil {
		log.Error(err)
		return err
	}

	if err := moveFile(configMap, root, req.NewPath); err != nil {
		return err
	}

	cleanUpConfigMap(configMap)

	if err := h.UpdateConfigMap(c, configMap); err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}

func (h *ApiHandler) handleDeleteFile(c echo.Context) error {
	var file File

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

	if err := deleteFile(configMap, &file); err != nil {
		return err
	}

	cleanUpConfigMap(configMap)

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

	if root, err := getFileItemTree(configMap, "/"); err != nil {
		return err
	} else {
		return c.JSON(http.StatusOK, root)
	}
}

type FileItem struct {
	Name     string      `json:"path"`
	AbsPath  string      `json:"absPath"`
	IsDir    bool        `json:"isDir"`
	Content  string      `json:"content"`
	Children []*FileItem `json:"children,omitempty"`
}

// Internal functions

func newFileItem(path string, isDir bool, content string) *FileItem {
	var children []*FileItem

	if isDir {
		children = make([]*FileItem, 0, 1)
	}

	parts := strings.Split(path, "/")

	return &FileItem{
		Name:     parts[len(parts)-1],
		AbsPath:  path,
		IsDir:    isDir,
		Content:  content,
		Children: children,
	}
}

func findParentNode(parentAbsPath string, subRoot *FileItem) *FileItem {
	if parentAbsPath == "" {
		return subRoot
	}

	if parentAbsPath == subRoot.AbsPath && subRoot.IsDir {
		return subRoot
	}

	for _, item := range subRoot.Children {
		if item.IsDir && strings.HasPrefix(parentAbsPath, item.AbsPath) {
			return findParentNode(parentAbsPath, item)
		}
	}

	return nil
}

func decodeFilePath(path string) string {
	return strings.ReplaceAll(path, KAPP_SLASH_REPLACER, "/")
}

func encodeFilePath(path string) string {
	return strings.ReplaceAll(path, "/", KAPP_SLASH_REPLACER)
}

func addFile(configMap *coreV1.ConfigMap, file *File) error {
	fileKey := encodeFilePath(file.Path)

	if _, exist := configMap.Data[fileKey]; exist {
		return fmt.Errorf("File or dir Exist")
	}

	// validate file path format, the first char must be "/"
	pathParts := strings.Split(file.Path[1:], "/")

	for i := range pathParts {
		if i < len(pathParts)-1 {
			dirName := KAPP_SLASH_REPLACER + strings.Join(pathParts[:i+1], KAPP_SLASH_REPLACER)

			if data, ok := configMap.Data[dirName]; ok {
				if data == KAPP_DIR_PLACEHOLDER || data == KAPP_PERSISTENT_DIR_PLACEHOLDER {
					continue
				} else {
					return fmt.Errorf("Can't create file at %s, %s exists and it's not a dir.", file.Path, dirName)
				}
			}

			configMap.Data[dirName] = KAPP_DIR_PLACEHOLDER
		} else {
			if file.IsDir {
				configMap.Data[fileKey] = KAPP_PERSISTENT_DIR_PLACEHOLDER
			} else {
				configMap.Data[fileKey] = file.Content
			}
		}
	}

	return nil
}

func updateFile(configMap *coreV1.ConfigMap, file *File) error {
	fileKey := encodeFilePath(file.Path)
	data, exist := configMap.Data[fileKey]

	if !exist {
		return fmt.Errorf("File or dir doesn't exist")
	}

	if data == KAPP_DIR_PLACEHOLDER || data == KAPP_PERSISTENT_DIR_PLACEHOLDER {
		return fmt.Errorf("%s is a dir, not a file", file.Path)
	}

	configMap.Data[fileKey] = file.Content
	return nil
}

func moveFile(configMap *coreV1.ConfigMap, root *FileItem, newPath string) error {
	if root.IsDir {
		for _, child := range root.Children {
			np := fmt.Sprintf("%s/%s", newPath, child.Name)
			err := moveFile(configMap, child, np)
			if err != nil {
				return err
			}
		}
	} else {
		err := addFile(configMap, &File{
			Path:    newPath,
			Content: root.Content,
			IsDir:   false,
		})

		if err != nil {
			return err
		}

		err = deleteFile(configMap, &File{Path: root.AbsPath})

		if err != nil {
			return err
		}
	}

	return nil
}

func deleteFile(configMap *coreV1.ConfigMap, file *File) error {
	fileKey := encodeFilePath(file.Path)
	data, exist := configMap.Data[fileKey]

	if !exist {
		return fmt.Errorf("File or dir doesn't exist")
	}

	if data == KAPP_DIR_PLACEHOLDER || data == KAPP_PERSISTENT_DIR_PLACEHOLDER {
		for key := range configMap.Data {
			if strings.HasPrefix(key, fileKey+KAPP_SLASH_REPLACER) {
				delete(configMap.Data, key)
			}
		}
	}

	delete(configMap.Data, fileKey)

	return nil
}

func getFileItemTree(configMap *coreV1.ConfigMap, basePath string) (*FileItem, error) {
	filePaths := make([]string, 0, len(configMap.Data))
	encodedBasePath := encodeFilePath(basePath)

	if _, ok := configMap.Data[encodedBasePath]; !ok {
		return nil, fmt.Errorf("No entry at basePath: %s", basePath)
	}

	for encodedFilePath := range configMap.Data {
		if strings.HasPrefix(encodedFilePath, encodedBasePath) {
			filePaths = append(filePaths, encodedFilePath)
		}
	}

	sort.Strings(filePaths)
	var root *FileItem

	for _, filePath := range filePaths {
		content := configMap.Data[filePath]
		rawFilePath := decodeFilePath(filePath)

		var node *FileItem
		if content == KAPP_DIR_PLACEHOLDER || content == KAPP_PERSISTENT_DIR_PLACEHOLDER {
			node = newFileItem(rawFilePath, true, "")

			if root == nil {
				root = node
				continue
			}
		} else {
			node = newFileItem(rawFilePath, false, content)

			if root == nil {
				return node, nil
			}
		}

		parts := strings.Split(node.AbsPath, "/")
		parentNode := findParentNode(strings.Join(parts[:len(parts)-1], "/"), root)

		if parentNode == nil {
			err := fmt.Errorf("can't find partent node for path %s", node.AbsPath)
			return nil, err
		}

		parentNode.Children = append(parentNode.Children, node)
	}

	return root, nil
}

func cleanUpConfigMap(configMap *coreV1.ConfigMap) {
	validDirs := map[string]bool{}
	existingDirs := map[string]bool{}

	for encodedFilePath, content := range configMap.Data {
		if content == KAPP_DIR_PLACEHOLDER {
			existingDirs[encodedFilePath] = true
		} else {
			parts := strings.Split(encodedFilePath, KAPP_SLASH_REPLACER)

			for i := range parts {
				if i < len(parts)-1 {
					validDirs[strings.Join(parts[:i+1], KAPP_SLASH_REPLACER)] = true
				}
			}
		}
	}

	for dir := range existingDirs {
		if !validDirs[dir] {
			log.Info("Delete useless dir", dir)
			delete(configMap.Data, dir)
		}
	}

}
