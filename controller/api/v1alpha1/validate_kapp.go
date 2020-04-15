package v1alpha1

import apimachineryvalidation "k8s.io/apimachinery/pkg/api/validation"

func TryValidateApplication(appSpec ApplicationSpec, name, ns string) (rst KappValidateErrorList) {
	rst = append(rst, TryValidateApplicationSpec(appSpec)...)
	rst = append(rst, isValidateName(name)...)
	rst = append(rst, isValidateNamespace(ns)...)

	return
}

func TryValidateApplicationSpec(appSpec ApplicationSpec) (rst KappValidateErrorList) {
	// for now check
	//   - dependency
	//   - probe
	//   - cpu & memory
	validateFuncs := []func(ApplicationSpec) KappValidateErrorList{
		isValidateDependency,
		isValidateProbe,
		isValidateResource,
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
