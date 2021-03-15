package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"time"

	client2 "github.com/kalmhq/kalm/api/client"
	"github.com/kalmhq/kalm/api/log"
	"github.com/kalmhq/kalm/api/server"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/suite"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/envtest"
)

type WithControllerTestSuite struct {
	suite.Suite
	testEnv   *envtest.Environment
	cfg       *rest.Config
	client    client.Client
	apiServer *echo.Echo
	ctx       context.Context
}

type ResponseRecorder struct {
	*httptest.ResponseRecorder
	bytes []byte
}

func (r *ResponseRecorder) read() {
	r.bytes = r.Body.Bytes()
}

func (r *ResponseRecorder) BodyAsString() string {
	return string(r.bytes)
}

func (r *ResponseRecorder) BodyAsJSON(obj interface{}) {
	bytes := r.bytes
	err := json.Unmarshal(bytes, obj)

	if err != nil {
		panic(fmt.Errorf("Unmarshal response body failed, err:%+v, resp bytes: %s", err, bytes))
	}
}

func (suite *WithControllerTestSuite) SetupSuite() {
	log.InitDefaultLogger(true)

	os.Setenv("KALM_SKIP_ISTIO_METRICS", "true")

	suite.Nil(scheme.AddToScheme(scheme.Scheme))
	suite.Nil(v1alpha1.AddToScheme(scheme.Scheme))
	suite.ctx = context.Background()

	suite.testEnv = &envtest.Environment{
		CRDDirectoryPaths: []string{filepath.Join("..", "..", "controller", "config", "crd", "bases")},
	}

	cfg, err := suite.testEnv.Start()
	if err != nil {
		panic(err)
	}

	suite.cfg = cfg

	clt, err := client.New(cfg, client.Options{Scheme: scheme.Scheme})
	if err != nil {
		panic(err)
	}

	suite.client = clt

	suite.apiServer = suite.SetupApiServer()
}

func (suite *WithControllerTestSuite) SetupApiServer(policies ...string) *echo.Echo {
	e := server.NewEchoInstance()
	clientManager := client2.NewFakeClientManager(suite.cfg, strings.Join(policies, ""))
	apiHandler := NewApiHandler(clientManager)
	apiHandler.InstallMainRoutes(e)
	apiHandler.InstallWebhookRoutes(e)
	return e
}

func GrantUserRoles(email string, roles ...string) string {
	var sb strings.Builder
	sb.WriteString("\n")

	for i := range roles {
		sb.WriteString(fmt.Sprintf("g, %s, %s\n", client2.ToSafeSubject(email, v1alpha1.SubjectTypeUser), roles[i]))
	}

	return sb.String()
}

func GetViewerRoleOfNamespace(name string) string {
	return fmt.Sprintf("role_%s_viewer", name)
}

func GetEditorRoleOfNamespace(name string) string {
	return fmt.Sprintf("role_%s_editor", name)
}

// func GetOwnerRoleOfNs(name string) string {
// 	return fmt.Sprintf("role_%sOwner", name)
// }

func GetClusterViewerRole() string {
	return "role_cluster_viewer"
}

func GetClusterEditorRole() string {
	return "role_cluster_editor"
}

func GetClusterOwnerRole() string {
	return "role_cluster_owner"
}

func (suite *WithControllerTestSuite) SetupApiServerWithoutPolicy() {
	suite.SetupApiServer("")
}

func (suite *WithControllerTestSuite) Get(namespace, name string, obj runtime.Object) error {
	return suite.client.Get(suite.ctx, types.NamespacedName{Namespace: namespace, Name: name}, obj)
}

func (suite *WithControllerTestSuite) List(obj runtime.Object, opts ...client.ListOption) error {
	return suite.client.List(suite.ctx, obj, opts...)
}

func (suite *WithControllerTestSuite) Create(obj runtime.Object, opts ...client.CreateOption) error {
	return suite.client.Create(suite.ctx, obj, opts...)
}

func (suite *WithControllerTestSuite) Delete(obj runtime.Object, opts ...client.DeleteOption) error {
	return suite.client.Delete(suite.ctx, obj, opts...)
}

func (suite *WithControllerTestSuite) Update(obj runtime.Object, opts ...client.UpdateOption) error {
	return suite.client.Update(suite.ctx, obj, opts...)
}

func (suite *WithControllerTestSuite) Patch(obj runtime.Object, patch client.Patch, opts ...client.PatchOption) error {
	return suite.client.Patch(suite.ctx, obj, patch, opts...)
}

func (suite *WithControllerTestSuite) TearDownSuite() {
	_ = suite.testEnv.Stop()
}

func (suite *WithControllerTestSuite) Eventually(condition func() bool, msgAndArgs ...interface{}) bool {
	waitFor := time.Second * 20
	tick := time.Millisecond * 500
	return suite.Suite.Eventually(condition, waitFor, tick, msgAndArgs...)
}

func (suite *WithControllerTestSuite) NewRequest(method string, path string, body interface{}) *ResponseRecorder {
	return BaseRequest(suite.apiServer, method, path, body, nil)
}

func (suite *WithControllerTestSuite) NewRequestWithIdentity(method string, path string, body interface{}, email string, roles ...string) *ResponseRecorder {
	return BaseRequest(suite.apiServer, method, path, body, map[string]string{
		echo.HeaderAuthorization: "Bearer " + client2.ToFakeToken(email, roles...),
	})
}

func BaseRequest(server *echo.Echo, method string, path string, body interface{}, headers map[string]string) *ResponseRecorder {
	var reader io.Reader

	switch v := body.(type) {
	case nil:
		reader = bytes.NewReader([]byte{})
	case string:
		reader = strings.NewReader(v)
	default:
		reader = toReader(body)
	}

	req := httptest.NewRequest(method, path, reader)

	for k, v := range headers {
		req.Header.Add(k, v)
	}

	req.Header.Add(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := &ResponseRecorder{
		ResponseRecorder: httptest.NewRecorder(),
	}

	server.ServeHTTP(rec, req)
	rec.read()
	return rec
}

type TestRequestContext struct {
	User      string
	Groups    []string
	Roles     []string
	Headers   map[string]string
	Namespace string

	Method           string
	Path             string
	Body             interface{}
	TestWithRoles    func(rec *ResponseRecorder)
	TestWithoutRoles func(rec *ResponseRecorder)

	CleanUp func(c *TestRequestContext, s *echo.Echo)

	Debug bool
}

func (suite *WithControllerTestSuite) DoTestRequest(rc *TestRequestContext) {
	if rc.User == "" {
		rc.User = "foo@bar"
	}

	if rc.TestWithoutRoles != nil {
		s := suite.SetupApiServer()

		rec := BaseRequest(s, rc.Method, rc.Path, rc.Body, map[string]string{
			echo.HeaderAuthorization: "Bearer " + client2.ToFakeToken(rc.User, rc.Groups...),
		})

		rc.TestWithoutRoles(rec)
	}

	if rc.TestWithRoles != nil {
		ps := []string{client2.BuildClusterRolePolicies()}

		if rc.Namespace != "" {
			ps = append(ps, client2.BuildRolePoliciesForNamespace(rc.Namespace))
		}

		ps = append(ps, GrantUserRoles(rc.User, rc.Roles...))

		if rc.Debug {
			println(strings.Join(ps, ""))
		}

		s := suite.SetupApiServer(ps...)

		rec := BaseRequest(s, rc.Method, rc.Path, rc.Body, map[string]string{
			echo.HeaderAuthorization: "Bearer " + client2.ToFakeToken(rc.User, rc.Groups...),
		})

		rc.TestWithRoles(rec)

		if rc.CleanUp != nil {
			rc.CleanUp(rc, s)
		}
	}
}

func (suite *WithControllerTestSuite) IsUnauthorizedError(rec *ResponseRecorder, substrs ...string) {
	var res map[string]interface{}
	rec.BodyAsJSON(&res)

	suite.Require().Equal(401, rec.Code, "Should be an Unauthorized error with code 401")

	if _, ok := res["message"]; !ok {
		suite.Fail("Expect missing role message, but message is empty")
		return
	}

	if _, ok := res["message"].(string); !ok {
		suite.Fail("Expect missing role message, but message is not string")
		return
	}

	for _, substr := range substrs {
		suite.Contains(res["message"], substr)
	}
}

func toReader(obj interface{}) io.Reader {
	bts, _ := json.Marshal(obj)
	return bytes.NewBuffer(bts)
}

// func (suite *WithControllerTestSuite) getPVCList(ns string) (*v1.PersistentVolumeClaimList, error) {
// 	var pvcList v1.PersistentVolumeClaimList
// 	err := suite.List(&pvcList, client.InNamespace(ns))
// 	return &pvcList, err
// }

// func (suite *WithControllerTestSuite) getComponentList(ns string) (v1alpha1.ComponentList, error) {
// 	var compList v1alpha1.ComponentList
// 	err := suite.List(&compList, client.InNamespace(ns))
// 	return compList, err
// }

func (suite *WithControllerTestSuite) getComponent(ns, compName string) (v1alpha1.Component, error) {
	var comp v1alpha1.Component
	err := suite.Get(ns, compName, &comp)
	return comp, err
}

func (suite *WithControllerTestSuite) ensureNamespaceExist(ns string) {
	nsKey := metaV1.ObjectMeta{Name: ns}

	var namespace v1.Namespace
	err := suite.Get("", ns, &namespace)

	if err != nil {
		if errors.IsNotFound(err) {
			err = suite.Create(&v1.Namespace{ObjectMeta: nsKey})
			suite.Nil(err)
		} else {
			panic(err)
		}
	}

	suite.Eventually(func() bool {
		err := suite.Get("", ns, &namespace)
		return err == nil
	})
}

func (suite *WithControllerTestSuite) ensureNamespaceDeleted(ns string) {
	suite.ensureObjectDeleted(&v1.Namespace{ObjectMeta: metaV1.ObjectMeta{Name: ns}})
}

func (suite *WithControllerTestSuite) ensureObjectDeleted(obj runtime.Object) {
	_ = suite.Delete(obj)

	suite.Eventually(func() bool {
		key, err := client.ObjectKeyFromObject(obj)
		if err != nil {
			return false
		}
		err = suite.Get(key.Namespace, key.Name, obj)
		return errors.IsNotFound(err)
	})
}
