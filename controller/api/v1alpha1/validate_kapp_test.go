package v1alpha1

import (
	"encoding/json"
	"fmt"
	"github.com/stretchr/testify/assert"
	"k8s.io/apiextensions-apiserver/pkg/apis/apiextensions"
	apiextv1beta1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1beta1"
	"k8s.io/apiextensions-apiserver/pkg/apiserver/validation"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/serializer"
	"k8s.io/apimachinery/pkg/util/sets"
	yaml2 "k8s.io/apimachinery/pkg/util/yaml"
	"testing"
)

func TestValidateUsingOpenAPI(t *testing.T) {
	var crdSpec = []byte(`
apiVersion: apiextensions.k8s.io/v1beta1
kind: CustomResourceDefinition
metadata:
  annotations:
    controller-gen.kubebuilder.io/version: v0.2.4
  creationTimestamp: null
  name: applications.core.kapp.dev
spec:
  group: core.kapp.dev
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

	sch := runtime.NewScheme()
	_ = apiextv1beta1.AddToScheme(sch)

	//decode := scheme.Codecs.UniversalDeserializer().Decode
	decode := serializer.NewCodecFactory(sch).UniversalDeserializer().Decode

	obj, _, err := decode(crdSpec, nil, nil)
	if err != nil {
		fmt.Printf("%#v", err)
	}

	//fmt.Println("obj:", obj)
	crd, ok := obj.(*apiextv1beta1.CustomResourceDefinition)
	if !ok {
		t.Fatal("no CRD")
	}

	openAPIV3Schema := crd.Spec.Validation.OpenAPIV3Schema

	in := openAPIV3Schema
	out := apiextensions.JSONSchemaProps{}
	err = apiextv1beta1.Convert_v1beta1_JSONSchemaProps_To_apiextensions_JSONSchemaProps(in, &out, nil)
	if err != nil {
		t.Fatal(err)
	}

	validator, _, err := validation.NewSchemaValidator(&apiextensions.CustomResourceValidation{OpenAPIV3Schema: &out})
	if err != nil {
		t.Fatal(err)
	}
	//fmt.Println("openAPIV3Schema:", openAPIV3Schema)

	goodSampleApp := `apiVersion: core.kapp.dev/v1alpha1
kind: Application
metadata:
  name: socks
  namespace: kapp-socks`

	badSampleApp := `apiVersion: core.kapp.dev/v1alpha1
kind: Application
metadata: foobar`

	tests := []struct {
		appSpec       string
		expectedError []string
	}{
		{
			appSpec:       goodSampleApp,
			expectedError: nil,
		},
		{
			appSpec:       badSampleApp,
			expectedError: []string{`metadata: Invalid value: "string": metadata in body must be of type object: "string"`},
		},
		{
			appSpec: `kind: 123`,
			expectedError: []string{`kind: Invalid value: "number": kind in body must be of type string: "number"`},
		},
	}

	for i, test := range tests {

		j, err := yaml2.ToJSON([]byte(test.appSpec))
		assert.Nil(t, err)

		unstructured := make(map[string]interface{})
		err = json.Unmarshal(j, &unstructured)
		assert.Nil(t, err)

		errs := validation.ValidateCustomResource(nil, unstructured, validator)
		if len(errs) > 0 {
			if test.expectedError == nil {
				t.Errorf("unexpected validation error for %v: %v", unstructured, errs)
			} else {
				sawErrors := sets.NewString()
				for _, err := range errs {
					sawErrors.Insert(err.Error())
					//fmt.Println("sawError", err.Field)
				}

				expectErrs := sets.NewString(test.expectedError...)

				for _, unexpectedError := range sawErrors.Difference(expectErrs).List() {
					t.Errorf("%d: unexpected error: %s", i, unexpectedError)
				}
			}
		} else {
			if test.expectedError == nil {
				continue
			}

			t.Errorf("missing validation errors: %v", test.expectedError)
		}
	}
}
