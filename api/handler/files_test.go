package handler

import (
	"github.com/kalmhq/kalm/controller/lib/files"
	"github.com/stretchr/testify/suite"
	"net/http"
	"testing"
)

type FilesTestSuite struct {
	WithControllerTestSuite
}

func (suite *FilesTestSuite) TearDownTest() {
	err := suite.k8sClinet.CoreV1().ConfigMaps("default").Delete(files.KALM_CONFIG_MAP_NAME, nil)
	suite.Nil(err)
}

func (suite *FilesTestSuite) GetFileList() *files.FileItem {
	rec := suite.NewRequest(http.MethodGet, "/v1alpha1/files/default", nil)
	suite.Equal(200, rec.Code)

	var res files.FileItem
	rec.BodyAsJSON(&res)
	return &res
}

func (suite *FilesTestSuite) createFile(path string, isDir bool, content string) *ResponseRecorder {
	// two ways to pass create file params

	return suite.NewRequest(http.MethodPost, "/v1alpha1/files/default", map[string]interface{}{
		"files": []interface{}{map[string]interface{}{
			"path":    path,
			"isDir":   isDir,
			"content": content,
		}},
	})

	//return suite.NewRequest(http.MethodPost, "/v1alpha1/files/default", map[string]interface{}{
	//	"file": map[string]interface{}{
	//		"path":    path,
	//		"isDir":   isDir,
	//		"content": content,
	//	},
	//})
}

func (suite *FilesTestSuite) updateFile(path string, content string) *ResponseRecorder {
	return suite.NewRequest(http.MethodPut, "/v1alpha1/files/default", map[string]interface{}{
		"path":    path,
		"content": content,
	})
}

func (suite *FilesTestSuite) moveFile(oldPath, newPath string) *ResponseRecorder {
	return suite.NewRequest(http.MethodPut, "/v1alpha1/files/default/move", map[string]interface{}{
		"oldPath": oldPath,
		"newPath": newPath,
	})
}

func (suite *FilesTestSuite) deleteFile(path string) *ResponseRecorder {
	return suite.NewRequest(http.MethodDelete, "/v1alpha1/files/default", map[string]interface{}{
		"path": path,
	})
}

func (suite *FilesTestSuite) TestGetEmptyFileList() {
	res := suite.GetFileList()

	suite.Equal("/", res.AbsPath)
	suite.Equal(0, len(res.Children))
}

func (suite *FilesTestSuite) TestCreateSampleFile() {
	rec := suite.createFile("/root-level-file", false, "content")
	suite.Equal(http.StatusCreated, rec.Code)

	root := suite.GetFileList()
	suite.Equal(1, len(root.Children))
	suite.Equal("root-level-file", root.Children[0].Name)
	suite.Equal("/root-level-file", root.Children[0].AbsPath)
	suite.Equal(false, root.Children[0].IsDir)
	suite.Equal("content", root.Children[0].Content)
	suite.Nil(root.Children[0].Children)
}

func (suite *FilesTestSuite) TestCreateFiles() {
	rec := suite.createFile("/a/b/d", false, "content")
	suite.Equal(http.StatusCreated, rec.Code)

	// DIR:  /a
	// DIR:    /b
	// FILE:     /d
	root := suite.GetFileList()
	root = root.Children[0]
	suite.Equal(1, len(root.Children))
	suite.Equal("a", root.Name)
	suite.Equal("/a", root.AbsPath)
	suite.Equal(true, root.IsDir)
	suite.Equal("", root.Content)

	root = root.Children[0]
	suite.Equal(1, len(root.Children))
	suite.Equal("b", root.Name)
	suite.Equal("/a/b", root.AbsPath)
	suite.Equal(true, root.IsDir)
	suite.Equal("", root.Content)

	root = root.Children[0]
	suite.Nil(root.Children)
	suite.Equal("d", root.Name)
	suite.Equal("/a/b/d", root.AbsPath)
	suite.Equal(false, root.IsDir)
	suite.Equal("content", root.Content)

	// Create a new Empty dir with existing parent dir

	rec = suite.createFile("/a/b/c", false, "content")
	suite.Equal(http.StatusCreated, rec.Code)

	// DIR:  /a
	// DIR:    /b
	// DIR:      /c
	// FILE:     /d
	root = suite.GetFileList()
	suite.Equal(2, len(root.Children[0].Children[0].Children))

	// Can not create things at existing path
	rec = suite.createFile("/a/b", false, "content")
	suite.NotEqual(http.StatusCreated, rec.Code)

	rec = suite.createFile("/a/b/d", false, "content")
	suite.NotEqual(http.StatusCreated, rec.Code)

	// Can not create middle dir, since there is already a file there
	// Eg, we can't create /a/b/d/e file, because /a/b/d is a file
	rec = suite.createFile("/a/b/d/e", false, "content")
	suite.NotEqual(http.StatusCreated, rec.Code)
}

func (suite *FilesTestSuite) TestUpdateFiles() {
	// prepare
	_ = suite.createFile("/a/b/d", false, "content2")
	_ = suite.createFile("/a/b/c", false, "content1")

	// DIR:  /a
	// DIR:    /b
	// FILE:     /d
	// FILE:     /c
	root := suite.GetFileList()
	root = root.Children[0].Children[0] // b dir
	suite.Equal(2, len(root.Children))
	suite.Equal("content1", root.Children[0].Content)
	suite.Equal("content2", root.Children[1].Content)

	// Can't update dir
	rec := suite.updateFile("/a/b", "content")
	suite.NotEqual(http.StatusOK, rec.Code)

	// Can't update not-exist file
	rec = suite.updateFile("/a/b/balabala", "content")
	suite.NotEqual(http.StatusOK, rec.Code)

	// Should update
	rec = suite.updateFile("/a/b/d", "content-new")
	suite.Equal(http.StatusOK, rec.Code)

	root = suite.GetFileList()
	root = root.Children[0].Children[0] // b dir
	suite.Equal(2, len(root.Children))
	suite.Equal("content1", root.Children[0].Content)
	suite.Equal("content-new", root.Children[1].Content)
}

func (suite *FilesTestSuite) TestDeleteFiles() {
	// prepare
	_ = suite.createFile("/a/b/d", false, "content2")
	_ = suite.createFile("/a/b/c", false, "content1")

	// DIR:  /a
	// DIR:    /b
	// FILE:     /d
	// FILE:     /c
	root := suite.GetFileList()
	root = root.Children[0].Children[0] // b dir
	suite.Equal(2, len(root.Children))
	suite.Equal("content1", root.Children[0].Content)
	suite.Equal("content2", root.Children[1].Content)

	// Can't delete non-exist file
	rec := suite.deleteFile("/a/b/balabala")
	suite.NotEqual(http.StatusOK, rec.Code)

	// Should delete
	rec = suite.deleteFile("/a/b/d")
	suite.Equal(http.StatusOK, rec.Code)

	// DIR:  /a
	// DIR:    /b
	// FILE:     /c
	root = suite.GetFileList()
	root = root.Children[0].Children[0] // b dir
	suite.Equal(1, len(root.Children))
	suite.Equal("content1", root.Children[0].Content)

	rec = suite.deleteFile("/a/b/c")
	suite.Equal(http.StatusOK, rec.Code)

	// DIR:  /
	root = suite.GetFileList()
	suite.Equal(0, len(root.Children))
}

func (suite *FilesTestSuite) TestDeleteDir() {
	// prepare
	_ = suite.createFile("/a/b/d", false, "content2")
	_ = suite.createFile("/a/b/c", false, "content1")

	// DIR:  /a
	// DIR:    /b
	// FILE:     /c
	// FILE:     /d
	root := suite.GetFileList()
	root = root.Children[0].Children[0] // b dir
	suite.Equal(2, len(root.Children))
	suite.Equal("content1", root.Children[0].Content)
	suite.Equal("content2", root.Children[1].Content)

	// Should delete
	rec := suite.deleteFile("/a/b")
	suite.Equal(http.StatusOK, rec.Code)

	// DIR:  /
	root = suite.GetFileList()
	suite.Equal(0, len(root.Children))
}

func (suite *FilesTestSuite) TestMove() {
	// prepare
	_ = suite.createFile("/a/b/d", false, "content2")
	_ = suite.createFile("/a/b/c", false, "content1")

	// DIR:  /a
	// DIR:    /b
	// FILE:     /c
	// FILE:     /d
	root := suite.GetFileList()
	root = root.Children[0].Children[0] // b dir
	suite.Equal(2, len(root.Children))
	suite.Equal("content1", root.Children[0].Content)
	suite.Equal("content2", root.Children[1].Content)
	suite.Equal("d", root.Children[1].Name)

	// Should not move non-exist file
	rec := suite.moveFile("/a/b/balabala", "/a/b/c/d")
	suite.NotEqual(http.StatusOK, rec.Code)

	// Rename file
	rec = suite.moveFile("/a/b/d", "/a/b/z")
	suite.Equal(http.StatusOK, rec.Code)
	// DIR:  /a
	// DIR:    /b
	// FILE:     /c
	// FILE:     /z
	root = suite.GetFileList()
	root = root.Children[0].Children[0] // b dir
	suite.Equal(2, len(root.Children))
	suite.Equal("content1", root.Children[0].Content)
	suite.Equal("content2", root.Children[1].Content)
	suite.Equal("z", root.Children[1].Name)

	// Move dir
	rec = suite.moveFile("/a/b", "/x")
	suite.Equal(http.StatusOK, rec.Code)
	// DIR:  /x
	// FILE:   /c
	// FILE:   /z
	root = suite.GetFileList()
	root = root.Children[0] // x dir
	suite.Equal(2, len(root.Children))
	suite.Equal("content1", root.Children[0].Content)
	suite.Equal("content2", root.Children[1].Content)
	suite.Equal("z", root.Children[1].Name)

	// Move again
	rec = suite.moveFile("/x", "/a/b/c/d/e")
	suite.Equal(http.StatusOK, rec.Code)
	// DIR:  /a
	// DIR:    /b
	// DIR:      /c
	// DIR:        /d
	// DIR:          /e
	// FILE:           /c
	// FILE:           /z
	root = suite.GetFileList()
	root = root.Children[0].Children[0].Children[0].Children[0].Children[0] // e dir
	suite.Equal(2, len(root.Children))
	suite.Equal("content1", root.Children[0].Content)
	suite.Equal("content2", root.Children[1].Content)
	suite.Equal("z", root.Children[1].Name)

	// Move root
	rec = suite.moveFile("/", "/x")
	suite.Equal(http.StatusOK, rec.Code)
	// DIR:  /x
	// DIR:    /a
	// DIR:      /b
	// DIR:        /c
	// DIR:          /d
	// DIR:            /e
	// FILE:             /c
	// FILE:             /z
	root = suite.GetFileList()
	root = root.Children[0].Children[0].Children[0].Children[0].Children[0].Children[0] // e dir
	suite.Equal(2, len(root.Children))
	suite.Equal("content1", root.Children[0].Content)
	suite.Equal("content2", root.Children[1].Content)
	suite.Equal("z", root.Children[1].Name)
}

func TestFilesTestSuite(t *testing.T) {
	suite.Run(t, new(FilesTestSuite))
}
