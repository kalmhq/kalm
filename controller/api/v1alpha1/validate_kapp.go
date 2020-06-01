package v1alpha1

import (
	"fmt"
	"github.com/go-openapi/validate"
	"k8s.io/apiextensions-apiserver/pkg/apis/apiextensions"
	apiextv1beta1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1beta1"
	"k8s.io/apiextensions-apiserver/pkg/apiserver/validation"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/serializer"
)

func getValidatorForKappSpec(crdDefinition []byte) (*validate.SchemaValidator, error) {
	sch := runtime.NewScheme()
	_ = apiextv1beta1.AddToScheme(sch)

	decode := serializer.NewCodecFactory(sch).UniversalDeserializer().Decode

	obj, _, err := decode(crdDefinition, nil, nil)
	if err != nil {
		return nil, err
	}

	//fmt.Println("obj:", obj)
	crd, ok := obj.(*apiextv1beta1.CustomResourceDefinition)
	if !ok {
		return nil, fmt.Errorf("kapp CRD not valid")
	}

	openAPIV3Schema := crd.Spec.Validation.OpenAPIV3Schema

	in := openAPIV3Schema
	out := apiextensions.JSONSchemaProps{}
	err = apiextv1beta1.Convert_v1beta1_JSONSchemaProps_To_apiextensions_JSONSchemaProps(in, &out, nil)
	if err != nil {
		return nil, err
	}

	//fmt.Println("in:", openAPIV3Schema)

	validator, _, err := validation.NewSchemaValidator(
		&apiextensions.CustomResourceValidation{
			OpenAPIV3Schema: &out,
		})
	if err != nil {
		return nil, err
	}

	return validator, nil
}
