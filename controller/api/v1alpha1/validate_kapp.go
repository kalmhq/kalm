package v1alpha1

import (
	"fmt"
	"github.com/go-openapi/validate"
	"github.com/prometheus/common/log"
	"io/ioutil"
	"k8s.io/apiextensions-apiserver/pkg/apis/apiextensions"
	apiextv1beta1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1beta1"
	"k8s.io/apiextensions-apiserver/pkg/apiserver/validation"
	apimachineryvalidation "k8s.io/apimachinery/pkg/api/validation"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/serializer"
	"strings"
)

func TryValidateApplicationFromAPI(appSpec ApplicationSpec, name string) (rst KappValidateErrorList) {
	errAgainstOpenAPI := tryValidateUsingOpenAPIV3(Application{
		ObjectMeta: metav1.ObjectMeta{
			Name: name,
		},
		Spec: appSpec,
	})
	trimFieldPathPrefixForAPI(errAgainstOpenAPI)

	rst = append(rst, errAgainstOpenAPI...)
	rst = append(rst, TryValidateApplication(appSpec, name)...)

	return rst
}

func trimFieldPathPrefixForAPI(errList KappValidateErrorList) {
	for i := 0; i < len(errList); i++ {
		originPath := errList[i].Path

		if strings.HasPrefix(originPath, ".spec") {
			originPath = originPath[len(".spec"):]
		}

		if strings.HasPrefix(originPath, ".metadata") {
			originPath = originPath[len(".metadata"):]
		}

		errList[i].Path = originPath
	}
}

func TryValidateApplication(appSpec ApplicationSpec, name string) (rst KappValidateErrorList) {
	rst = append(rst, tryValidateApplicationSpec(appSpec)...)
	rst = append(rst, isValidateName(name)...)

	return
}

func tryValidateApplicationSpec(appSpec ApplicationSpec) (rst KappValidateErrorList) {
	// for now check
	//   - dependency
	//   - probe
	//   - cpu & memory
	validateFuncs := []func(ApplicationSpec) KappValidateErrorList{
		//isValidateDependency,
		//isValidateProbe,
		//isValidateResource,
	}

	for _, validateFunc := range validateFuncs {
		if errs := validateFunc(appSpec); errs != nil {
			rst = append(rst, errs...)
		}
	}

	return
}

//type IKappValidator interface {
//	Validate(spec ApplicationSpec) KappValidateErrorList
//	GetJsonPathOfWrongField(name string, spec ApplicationSpec) string
//}

func isValidateName(name string) (rst KappValidateErrorList) {
	errStrs := apimachineryvalidation.NameIsDNS1035Label(name, false)

	for _, err := range errStrs {
		rst = append(rst, KappValidateError{
			Err:  err,
			Path: ".name",
		})
	}

	return
}

func isValidateNamespace(ns string) (rst KappValidateErrorList) {
	errStrs := apimachineryvalidation.ValidateNamespaceName(ns, false)

	for _, err := range errStrs {
		rst = append(rst, KappValidateError{
			Err:  err,
			Path: ".namespace",
		})
	}

	return
}

func tryValidateUsingOpenAPIV3(app Application) KappValidateErrorList {
	kappCRD, ok := tryLoadKappCRDFile()
	if !ok {
		log.Warn("fail to load Kapp CRD file, OpenAPI validation is skipped")
		return nil
	}

	validator, err := getValidatorForKappSpec(kappCRD)
	if err != nil {
		log.Warn("fail to get validator using kappCRD, err:", err)
		return nil
	}

	//fmt.Println("1.", string(kappCRD))
	//fmt.Println("2.", validator)

	errs := validation.ValidateCustomResource(nil, app, validator)

	return toKappValidateErrors(errs)
}

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

func tryLoadKappCRDFile() ([]byte, bool) {
	fileName := "core.kapp.dev_applications.yaml"
	dirs := []string{
		"../../config/crd/bases/",
		"../controller/config/crd/bases/",
		"./",
		"/",
	}

	for _, dir := range dirs {
		if !isFileExistUnderDir(fileName, dir) {
			continue
		}

		bytes, err := ioutil.ReadFile(dir + fileName)
		if err != nil {
			continue
		}

		return bytes, true
	}

	return nil, false
}

func isFileExistUnderDir(fileName string, dir string) bool {
	fileInfos, err := ioutil.ReadDir(dir)
	if err != nil {
		return false
	}

	for _, fileInfo := range fileInfos {
		if fileInfo.IsDir() {
			continue
		}

		if fileInfo.Name() == fileName {
			return true
		}
	}

	return false
}
