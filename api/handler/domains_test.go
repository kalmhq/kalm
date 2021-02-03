package handler

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/rand"
)

type DomainTestSuite struct {
	WithControllerTestSuite
}

func TestDomain(t *testing.T) {
	suite.Run(t, new(DomainTestSuite))
}

func (suite *DomainTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
}

var domain = resources.Domain{Domain: "www.example.com"}

func (suite *DomainTestSuite) TearDownTest() {
	// clean created domains if exist
	var domainList v1alpha1.DomainList
	suite.List(&domainList)

	for _, domain := range domainList.Items {
		suite.Delete(&v1alpha1.Domain{
			ObjectMeta: metav1.ObjectMeta{
				Name: domain.Name,
			},
		})
	}
}

func (suite *DomainTestSuite) TestListEmpty() {
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterViewerRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/domains",
		TestWithRoles: func(rec *ResponseRecorder) {
			var res []resources.Domain
			rec.BodyAsJSON(&res)
			suite.Equal(200, rec.Code)
			suite.Equal(0, len(res))
		},
	})
}

//todo more fine-grained tests on permission
func (suite *DomainTestSuite) TestPermission() {
	// create: manage

	// auth fail
	rolesListWillFailAuthz := [][]string{
		{GetClusterViewerRole()},
	}

	for _, roles := range rolesListWillFailAuthz {
		suite.DoTestRequest(&TestRequestContext{
			Roles:  roles,
			Method: http.MethodPost,
			Body:   domain,
			Path:   "/v1alpha1/domains",
			TestWithRoles: func(rec *ResponseRecorder) {
				suite.IsUnauthorizedError(rec)
			},
		})
	}

	// auth pass
	rolesListWillPassAuthz := [][]string{
		// {GetClusterEditorRole()},
		{GetClusterOwnerRole()},
	}

	for _, roles := range rolesListWillPassAuthz {
		suite.DoTestRequest(&TestRequestContext{
			Roles:  roles,
			Method: http.MethodPost,
			Body:   randomDomain(),
			Path:   "/v1alpha1/domains",
			TestWithRoles: func(rec *ResponseRecorder) {
				suite.Equal(201, rec.Code)
			},
		})
	}
}

func randomDomain() resources.Domain {
	return resources.Domain{Domain: fmt.Sprintf("%s-example.com", rand.String(10))}
}

func (suite *DomainTestSuite) TestCreateListAndDelete() {
	// create
	var domainName string
	suite.DoTestRequest(&TestRequestContext{
		Roles:  []string{GetClusterOwnerRole()},
		Method: http.MethodPost,
		Body:   domain,
		Path:   "/v1alpha1/domains",
		TestWithRoles: func(rec *ResponseRecorder) {
			var res resources.Domain
			rec.BodyAsJSON(&res)
			suite.Equal(201, rec.Code)
			suite.Equal(domain.Domain, res.Domain)
			// cname is now generated at webhook
			// suite.NotEmpty(res.Target)

			domainName = res.Name
		},
	})

	//list
	suite.DoTestRequest(&TestRequestContext{
		Roles:  []string{GetClusterViewerRole()},
		Method: http.MethodGet,
		Path:   "/v1alpha1/domains",
		TestWithRoles: func(rec *ResponseRecorder) {
			var res []resources.Domain
			rec.BodyAsJSON(&res)
			suite.Equal(200, rec.Code)
			suite.Equal(1, len(res))
			suite.Equal(domain.Domain, res[0].Domain)
		},
	})

	//delete
	suite.DoTestRequest(&TestRequestContext{
		Roles:  []string{GetClusterOwnerRole()},
		Method: http.MethodGet,
		Path:   fmt.Sprintf("/v1alpha1/domains/%s", domainName),
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(200, rec.Code)
		},
	})
}
