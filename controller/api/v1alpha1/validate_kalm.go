package v1alpha1

import (
	"fmt"
	"github.com/go-openapi/validate"
	"k8s.io/apiextensions-apiserver/pkg/apis/apiextensions"
	apiextv1beta1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1beta1"
	"k8s.io/apiextensions-apiserver/pkg/apiserver/validation"
	apimachineryvalidation "k8s.io/apimachinery/pkg/api/validation"
	v1validation "k8s.io/apimachinery/pkg/apis/meta/v1/validation"
	//"k8s.io/utils/field"
	"k8s.io/apimachinery/pkg/util/validation/field"

	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/serializer"
	apimachineryval "k8s.io/apimachinery/pkg/util/validation"
)

func getValidatorForKalmSpec(crdDefinition []byte) (*validate.SchemaValidator, error) {
	sch := runtime.NewScheme()
	_ = apiextv1beta1.AddToScheme(sch)

	decode := serializer.NewCodecFactory(sch).UniversalDeserializer().Decode

	obj, _, err := decode(crdDefinition, nil, nil)
	if err != nil {
		return nil, err
	}

	crd, ok := obj.(*apiextv1beta1.CustomResourceDefinition)
	if !ok {
		return nil, fmt.Errorf("kalm CRD not valid")
	}

	openAPIV3Schema := crd.Spec.Validation.OpenAPIV3Schema

	in := openAPIV3Schema
	out := apiextensions.JSONSchemaProps{}
	err = apiextv1beta1.Convert_v1beta1_JSONSchemaProps_To_apiextensions_JSONSchemaProps(in, &out, nil)
	if err != nil {
		return nil, err
	}

	validator, _, err := validation.NewSchemaValidator(
		&apiextensions.CustomResourceValidation{
			OpenAPIV3Schema: &out,
		})
	if err != nil {
		return nil, err
	}

	return validator, nil
}

// abc-def.xyz
func isValidHost(host string) bool {
	errs := apimachineryval.IsDNS1123Subdomain(host)
	return len(errs) == 0
}

// abc-123-xyz
func isValidResourceName(resName string) bool {
	errs := apimachineryvalidation.NameIsDNS1035Label(resName, false)
	return len(errs) == 0
}

func isValidLabels(labels map[string]string, path *field.Path) (bool, field.ErrorList) {
	errs := v1validation.ValidateLabels(labels, path)
	return len(errs) == 0, errs
}

func isValidLabelValue(labelVal string) bool {
	errs := apimachineryval.IsValidLabelValue(labelVal)
	return len(errs) == 0
}
