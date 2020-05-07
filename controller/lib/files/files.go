package files

import (
	"fmt"
	"sort"
	"strings"

	coreV1 "k8s.io/api/core/v1"
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

type FileItem struct {
	Name     string      `json:"name"`
	AbsPath  string      `json:"path"`
	IsDir    bool        `json:"isDir"`
	Content  string      `json:"content"`
	Children []*FileItem `json:"children,omitempty"`
}

func FindParentNode(parentAbsPath string, subRoot *FileItem) *FileItem {
	if parentAbsPath == "" {
		return subRoot
	}

	if parentAbsPath == subRoot.AbsPath && subRoot.IsDir {
		return subRoot
	}

	for _, item := range subRoot.Children {
		if item.IsDir && strings.HasPrefix(parentAbsPath, item.AbsPath) {
			return FindParentNode(parentAbsPath, item)
		}
	}

	return nil
}

func GetFileNameFromRawPath(path string) string {
	parts := strings.Split(path, "/")
	return parts[len(parts)-1]
}

func DecodeFilePath(path string) string {
	return strings.ReplaceAll(path, KAPP_SLASH_REPLACER, "/")
}

func EncodeFilePath(path string) string {
	return strings.ReplaceAll(path, "/", KAPP_SLASH_REPLACER)
}

func AddFile(configMap *coreV1.ConfigMap, file *File, replaceExistingOpt ...bool) error {
	fileKey := EncodeFilePath(file.Path)

	if configMap.Data == nil {
		configMap.Data = make(map[string]string)
	}

	if _, exist := configMap.Data[fileKey]; exist && (len(replaceExistingOpt) == 0 || replaceExistingOpt[0] == false) {
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

func UpdateFile(configMap *coreV1.ConfigMap, file *File) error {
	fileKey := EncodeFilePath(file.Path)
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

func MoveFile(configMap *coreV1.ConfigMap, root *FileItem, newPath string) error {
	if root.IsDir {
		for _, child := range root.Children {
			np := fmt.Sprintf("%s/%s", newPath, child.Name)
			err := MoveFile(configMap, child, np)
			if err != nil {
				return err
			}
		}
	} else {
		err := AddFile(configMap, &File{
			Path:    newPath,
			Content: root.Content,
			IsDir:   false,
		})

		if err != nil {
			return err
		}

		err = DeleteFile(configMap, &File{Path: root.AbsPath})

		if err != nil {
			return err
		}
	}

	return nil
}

func DeleteFile(configMap *coreV1.ConfigMap, file *File) error {
	fileKey := EncodeFilePath(file.Path)
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

func NewFileItem(path string, isDir bool, content string) *FileItem {
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

func GetFileItemTree(configMap *coreV1.ConfigMap, basePath string) (*FileItem, error) {
	filePaths := make([]string, 0, len(configMap.Data))
	encodedBasePath := EncodeFilePath(basePath)

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
		rawFilePath := DecodeFilePath(filePath)

		var node *FileItem
		if content == KAPP_DIR_PLACEHOLDER || content == KAPP_PERSISTENT_DIR_PLACEHOLDER {
			node = NewFileItem(rawFilePath, true, "")

			if root == nil {
				root = node
				continue
			}
		} else {
			node = NewFileItem(rawFilePath, false, content)

			if root == nil {
				return node, nil
			}
		}

		parts := strings.Split(node.AbsPath, "/")
		parentNode := FindParentNode(strings.Join(parts[:len(parts)-1], "/"), root)

		if parentNode == nil {
			err := fmt.Errorf("can't find partent node for path %s", node.AbsPath)
			return nil, err
		}

		parentNode.Children = append(parentNode.Children, node)
	}

	return root, nil
}

func CleanUpConfigMap(configMap *coreV1.ConfigMap) {
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
			delete(configMap.Data, dir)
		}
	}

}

func ResolveMountPaths(mountPaths map[string]map[string]bool, baseMountPath string, root *FileItem) {
	if root.IsDir {
		for _, child := range root.Children {
			ResolveMountPaths(mountPaths, fmt.Sprintf("%s/%s", baseMountPath, root.Name), child)
		}
	} else {
		if mountPaths[baseMountPath] == nil {
			mountPaths[baseMountPath] = make(map[string]bool)
		}

		mountPaths[baseMountPath][root.AbsPath] = true
	}
}
