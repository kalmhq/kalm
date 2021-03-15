package v1alpha1

import (
	"testing"

	cmv1alpha2 "github.com/jetstack/cert-manager/pkg/apis/certmanager/v1alpha2"
	"github.com/kalmhq/kalm/controller/validation"
	"github.com/stretchr/testify/assert"
)

var tmp = cmv1alpha2.IssuerConfig{}

var crdDefinitionInYaml = []byte(`
apiVersion: apiextensions.k8s.io/v1beta1
kind: CustomResourceDefinition
metadata:
  annotations:
    controller-gen.kubebuilder.io/version: v0.2.4
  creationTimestamp: null
  name: applications.core.kalm.dev
spec:
  group: core.kalm.dev
  names:
    kind: Application
    listKind: ApplicationList
    plural: applications
    singular: application
  scope: Namespaced
  subresources:
    status: {}
  validation:
    openAPIV3Schema:
      description: Application is the Schema for the applications API
      properties:
        apiVersion:
          description: 'APIVersion defines the versioned schema of this representation
            of an object. Servers should convert recognized schemas to the latest
            internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources'
          type: string
        kind:
          description: 'Kind is a string value representing the REST resource this
            object represents. Servers may infer this from the endpoint the client
            submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds'
          type: string
        metadata:
          type: object
      type: object
  version: v1alpha1
  versions:
  - name: v1alpha1
    served: true
    storage: true
status:
  acceptedNames:
    kind: ""
    plural: ""
  conditions: []
  storedVersions: []`)

func TestIsValidNoneWildcardDomain(t *testing.T) {
	type domainTest struct {
		domain string
		result bool
	}

	domainTests := []domainTest{
		{"google.com", true},
		{"map.google.com", true},
		{"stackoverflow.co.uk", true},
		{"x.y.com", true},
		{"10.0.0.1.xip.io", true},

		{"*.x.com", false},
		{".x.y.com", false},
		{"*", false},
		{"a*.com", false},
		{"a*b.com", false},
		{"*a.com", false},
	}

	for _, domainTest := range domainTests {
		assert.Equal(t, domainTest.result, validation.ValidateFQDN(domainTest.domain) == nil, "fail test on "+domainTest.domain)
	}
}

func TestIsValidWildcardDomain(t *testing.T) {
	type domainTest struct {
		domain string
		result bool
	}

	domainTests := []domainTest{
		{"google.com", false},
		{"map.google.com", false},
		{"stackoverflow.co.uk", false},
		{"x.y.com", false},
		{"10.0.0.1.xip.io", false},

		{"*.com", false},
		{"*.x.com", true},
		{".x.y.com", false},
		{"*", false},
		{"a*.com", false},
		{"a*b.com", false},
		{"*a.com", false},
	}

	for _, domainTest := range domainTests {
		assert.Equal(t, domainTest.result, IsValidWildcardDomainInCert(domainTest.domain), "fail test on "+domainTest.domain)
	}
}

func TestIsValidEmail(t *testing.T) {
	emails := []string{
		"test@golangcode.com",
		"foobar@stackoverflow.co.uk",
	}

	for _, d := range emails {
		assert.True(t, isValidEmail(d))
	}
}

func TestIsValidDomainInCert(t *testing.T) {
	type pair struct {
		domain string
		valid  bool
	}

	domains := []pair{
		{"*.example.com", true},
		{"*", false},
		{"*foo.example.com", false},
		{"*.com", false},
		{"a*.example.com", false},
		{"*b.example.com", false},
		{"a*b.example.com", false},
	}

	for _, pair := range domains {
		assert.Equal(t, pair.valid, isValidDomainInCert(pair.domain),
			"wrong for: "+pair.domain+
				" should be: ", pair.valid)
	}
}
