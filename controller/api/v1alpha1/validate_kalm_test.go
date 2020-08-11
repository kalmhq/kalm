package v1alpha1

import (
	"encoding/json"
	cmv1alpha2 "github.com/jetstack/cert-manager/pkg/apis/certmanager/v1alpha2"
	"github.com/stretchr/testify/assert"
	"k8s.io/apiextensions-apiserver/pkg/apiserver/validation"
	"k8s.io/apimachinery/pkg/util/sets"
	yaml2 "k8s.io/apimachinery/pkg/util/yaml"
	"testing"
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

func TestValidateUsingOpenAPI(t *testing.T) {

	validator, err := getValidatorForKalmSpec(crdDefinitionInYaml)
	assert.Nil(t, err)

	goodSampleApp := `apiVersion: core.kalm.dev/v1alpha1
kind: Application
metadata:
  name: socks
  namespace: kalm-socks`

	badSampleApp := `apiVersion: core.kalm.dev/v1alpha1
kind: Application
metadata: foobar`

	tests := []struct {
		appSpec        string
		expectedErrors []string
	}{
		{
			appSpec:        goodSampleApp,
			expectedErrors: nil,
		},
		{
			appSpec:        badSampleApp,
			expectedErrors: []string{`metadata: Invalid value: "string": metadata in body must be of type object: "string"`},
		},
		{
			appSpec:        `kind: 123`,
			expectedErrors: []string{`kind: Invalid value: "number": kind in body must be of type string: "number"`},
		},
	}

	for i, test := range tests {

		// yaml -> json
		jsonInBytes, err := yaml2.ToJSON([]byte(test.appSpec))
		assert.Nil(t, err)

		unstructured := make(map[string]interface{})
		err = json.Unmarshal(jsonInBytes, &unstructured)
		assert.Nil(t, err)

		errs := validation.ValidateCustomResource(nil, unstructured, validator)
		if len(errs) > 0 {
			if test.expectedErrors == nil {
				t.Errorf("unexpected validation error for %v: %v", unstructured, errs)
			} else {
				sawErrors := sets.NewString()
				for _, err := range errs {
					sawErrors.Insert(err.Error())
					//fmt.Println("sawError", err.Field)
				}

				expectErrs := sets.NewString(test.expectedErrors...)

				for _, unexpectedError := range sawErrors.Difference(expectErrs).List() {
					t.Errorf("%d: unexpected error: %s", i, unexpectedError)
				}
			}
		} else {
			if test.expectedErrors == nil {
				continue
			}

			t.Errorf("missing validation errors: %v", test.expectedErrors)
		}
	}
}

//func TestTryValidateOpenAPIV3(t *testing.T) {
//
//	app := Application{
//		Spec: ApplicationSpec{
//			Components: []ComponentSpec{
//				{
//					WorkloadType: "not-exist-type",
//				},
//			},
//		},
//	}
//
//	errList := tryValidateUsingOpenAPIV3(app)
//
//	assert.NotNil(t, errList)
//	assert.Equal(t, 2, len(errList))
//	fmt.Println(errList)
//}
//
//func TestUsingRealKalmCRD(t *testing.T) {
//	realCrdDef, err := ioutil.ReadFile("../../config/crd/bases/core.kalm.dev_applications.yaml")
//	if err != nil {
//		t.Fatal(err)
//	}
//
//	validator, err := getValidatorForKalmSpec(realCrdDef)
//	assert.NotNil(t, validator)
//	assert.Nil(t, err)
//
//	appSpecWithoutImage := `apiVersion: core.kalm.dev/v1alpha1
//kind: Application
//metadata:
//  name: socks
//  namespace: kalm-socks
//spec:
//  isActive: true
//  components:
//    - name: payment
//      dependencies:
//        - shippingservice
//      #image: weaveworksdemos/payment:0.4.3
//      cpu: 100m
//      memory: 100Mi
//      ports:
//        - name: http
//          containerPort: 80
//      livenessProbe:
//        httpGet:
//          path: /health
//          port: 80
//        initialDelaySeconds: 300
//        periodSeconds: 3
//      readinessProbe:
//        httpGet:
//          path: /health
//          port: 80
//        initialDelaySeconds: 180
//        periodSeconds: 3`
//
//	jsonInBytes, err := yaml2.ToJSON([]byte(appSpecWithoutImage))
//	assert.Nil(t, err)
//
//	unstructured := make(map[string]interface{})
//	err = json.Unmarshal(jsonInBytes, &unstructured)
//	assert.Nil(t, err)
//
//	errs := validation.ValidateCustomResource(field.NewPath("spec", "components"), unstructured, validator)
//	assert.Equal(t, 1, len(errs))
//	assert.Equal(t, "spec.components.spec.components.image: Required value", errs[0].Error())
//}

func TestIsValidDomain(t *testing.T) {
	domains := []string{
		"google.com",
		"stackoverflow.co.uk",
	}

	for _, d := range domains {
		assert.True(t, isValidDomain(d))
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
