package handler

import (
	"bytes"
	"encoding/json"
	"github.com/kapp-staging/kapp/api/client"
	"github.com/kapp-staging/kapp/api/config"
	"github.com/kapp-staging/kapp/api/server"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/suite"
	"io"
	"k8s.io/client-go/kubernetes"
	"net/http/httptest"
	"path/filepath"
	"sigs.k8s.io/controller-runtime/pkg/envtest"
	"strings"
)

type WithControllerTestSuite struct {
	suite.Suite
	testEnv   *envtest.Environment
	k8sClinet *kubernetes.Clientset
	apiServer *echo.Echo
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
	_ = json.Unmarshal(r.bytes, obj)
}

func (suite *WithControllerTestSuite) SetupSuite() {
	suite.testEnv = &envtest.Environment{
		CRDDirectoryPaths: []string{filepath.Join("..", "..", "controller", "config", "crd", "bases")},
	}

	cfg, err := suite.testEnv.Start()

	if err != nil {
		panic(err)
	}

	// TODO the test server has no permissions

	k8sClient, err := kubernetes.NewForConfig(cfg)

	if err != nil {
		panic(err)
	}

	suite.k8sClinet = k8sClient
	//spew.Dump(k8sClient.ServerVersion())
	//spew.Dump(k8sClient.CoreV1().Nodes().List(ListAll))

	runningConfig := &config.Config{
		KubernetesApiServerAddress: cfg.Host,
	}

	e := server.NewEchoServer(runningConfig)
	clientManager := client.NewClientManager(runningConfig)
	apiHandler := NewApiHandler(clientManager)
	apiHandler.Install(e)

	suite.apiServer = e
}

func (suite *WithControllerTestSuite) TearDownSuite() {
}

func (suite *WithControllerTestSuite) NewRequest(method string, path string, body interface{}) *ResponseRecorder {
	return suite.NewRequestWithHeaders(method, path, body, map[string]string{
		echo.HeaderAuthorization: "Bearer faketoken", // TODO use a real token
	})
}

func (suite *WithControllerTestSuite) NewRequestWithHeaders(method string, path string, body interface{}, headers map[string]string) *ResponseRecorder {
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

	if headers != nil {
		for k, v := range headers {
			req.Header.Add(k, v)
		}
	}
	req.Header.Add(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := &ResponseRecorder{
		ResponseRecorder: httptest.NewRecorder(),
	}
	suite.apiServer.ServeHTTP(rec, req)
	rec.read()
	return rec
}

func toReader(obj interface{}) io.Reader {
	bts, _ := json.Marshal(obj)
	return bytes.NewBuffer(bts)
}
