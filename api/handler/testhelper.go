package handler

import (
	"bytes"
	"encoding/json"
	"github.com/kapp-staging/kapp/api/client"
	"github.com/kapp-staging/kapp/api/config"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/suite"
	"io"
	"net/http/httptest"
	"path/filepath"
	"sigs.k8s.io/controller-runtime/pkg/envtest"
)

type BasicTestSuite struct {
	suite.Suite
	testEnv    *envtest.Environment
	apiServer  *echo.Echo
	apiHandler *ApiHandler
}

type ResponseRecorder struct {
	*httptest.ResponseRecorder
}

func (r *ResponseRecorder) BodyAsString() string {
	return r.Body.String()
}

func (r *ResponseRecorder) BodyAsJSON(obj interface{}) {
	_ = json.Unmarshal(r.Body.Bytes(), obj)
}

func (suite *BasicTestSuite) SetupSuite() {
	suite.testEnv = &envtest.Environment{
		CRDDirectoryPaths: []string{filepath.Join("..", "..", "controller", "config", "crd", "bases")},
	}

	cfg, err := suite.testEnv.Start()

	if err != nil {
		panic(err)
	}

	// TODO the test server has no permissions

	//k8sClient, err := kubernetes.NewForConfig(cfg)
	//if err != nil {
	//	panic(err)
	//}
	//spew.Dump(k8sClient.ServerVersion())
	//spew.Dump(k8sClient.CoreV1().Nodes().List(ListAll))

	e := echo.New()
	clientManager := client.NewClientManager(&config.Config{
		KubernetesApiServerAddress: cfg.Host,
	})

	apiHandler := NewApiHandler(clientManager)
	apiHandler.Install(e)

	suite.apiServer = e
	suite.apiHandler = apiHandler
}

func (suite *BasicTestSuite) TearDownSuite() {
}

func (suite *BasicTestSuite) NewRequest(method string, path string, body interface{}) *ResponseRecorder {
	return suite.NewRequestWithHeaders(method, path, body, map[string]string{
		echo.HeaderAuthorization: "Bearer faketoken", // TODO use a real token
	})
}

func (suite *BasicTestSuite) NewRequestWithHeaders(method string, path string, body interface{}, headers map[string]string) *ResponseRecorder {
	var reader io.Reader

	if body == nil {
		reader = bytes.NewReader([]byte{})
	} else {
		reader = toReader(body)
	}

	req := httptest.NewRequest(method, path, reader)

	if headers != nil {
		for k, v := range headers {
			req.Header.Add(k, v)
		}
	}
	req.Header.Add(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := &ResponseRecorder{httptest.NewRecorder()}
	suite.apiServer.ServeHTTP(rec, req)
	return rec
}

func toReader(obj interface{}) io.Reader {
	bts, _ := json.Marshal(obj)
	return bytes.NewBuffer(bts)
}
