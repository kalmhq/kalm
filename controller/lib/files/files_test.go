package files

import (
	"github.com/stretchr/testify/suite"
	coreV1 "k8s.io/api/core/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"testing"
)

type FilesTestSuite struct {
	suite.Suite
	cm *coreV1.ConfigMap
}

func (suite *FilesTestSuite) SetupTest() {
	suite.cm = &coreV1.ConfigMap{
		ObjectMeta: v1.ObjectMeta{
			Name:      "test",
			Namespace: "default",
		},
		Data: map[string]string{
			KALM_SLASH_REPLACER: KALM_PERSISTENT_DIR_PLACEHOLDER,
		},
	}
}

// More tests are in api project

func (suite *FilesTestSuite) TestCreateFile() {
	suite.Nil(AddFile(suite.cm, &File{
		Path:    "/a/b/c",
		Content: "content",
	}))

	root, err := GetFileItemTree(suite.cm, "/")
	suite.Nil(err)

	// DIR      /
	// DIR        /a
	// DIR          /b
	// FILE           /c
	root = root.Children[0].Children[0].Children[0]
	suite.Equal("c", root.Name)
	suite.Equal(false, root.IsDir)
	suite.Equal("content", root.Content)
	suite.Equal(0, len(root.Children))
}

func (suite *FilesTestSuite) TestResolveMountPaths() {
	suite.Nil(AddFile(suite.cm, &File{
		Path:    "/nginx/conf.d/default.conf",
		Content: "content",
	}))
	suite.Nil(AddFile(suite.cm, &File{
		Path:    "/nginx/conf.d/gateway.conf",
		Content: "content",
	}))
	suite.Nil(AddFile(suite.cm, &File{
		Path:    "/nginx/nginx.conf",
		Content: "content",
	}))
	suite.Nil(AddFile(suite.cm, &File{
		Path:    "/mime.types",
		Content: "content",
	}))

	// MountRules:
	// - MountPath: /etc/nginx
	//   Configs:
	//   - /nginx/nginx.conf
	//   - /nginx/conf.d
	//   - /mime.types

	res := make(map[string]map[string]bool)
	root, err := GetFileItemTree(suite.cm, "/nginx/nginx.conf")
	suite.Nil(err)
	ResolveMountPaths(res, "/etc/nginx", root)
	root, err = GetFileItemTree(suite.cm, "/nginx/conf.d")
	suite.Nil(err)
	ResolveMountPaths(res, "/etc/nginx", root)
	root, err = GetFileItemTree(suite.cm, "/mime.types")
	suite.Nil(err)
	ResolveMountPaths(res, "/etc/nginx", root)

	// (map[string]map[string]bool) (len=2) {
	//  (string) (len=10) "/etc/nginx": (map[string]bool) (len=2) {
	//   (string) (len=17) "/nginx/nginx.conf": (bool) true,
	//   (string) (len=11) "/mime.types": (bool) true
	//  },
	//  (string) (len=13) "/etc/nginx/conf.d": (map[string]bool) (len=2) {
	//   (string) (len=26) "/nginx/conf.d/default.conf": (bool) true,
	//   (string) (len=26) "/nginx/conf.d/gateway.conf": (bool) true
	//  }
	// }
}

func TestFilesTestSuite(t *testing.T) {
	suite.Run(t, new(FilesTestSuite))
}
