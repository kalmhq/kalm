package v1alpha1

import (
	"fmt"
	"strings"
)

type KappValidateErrorList []KappValidateError

func (k KappValidateErrorList) Error() string {
	var errs []string
	for _, one := range k {
		errs = append(errs, one.Error())
	}

	return strings.Join(errs, ";")
}

type KappValidateError struct {
	Err  string
	Path string
}

func (k KappValidateError) Error() string {
	return fmt.Sprintf("err: %s, path: %s", k.Err, k.Path)
}

func TryValidateApplication(appSpec ApplicationSpec) (rst KappValidateErrorList) {
	// for now only check dependency here
	validateFuncs := []func(spec ApplicationSpec) KappValidateErrorList{
		isValidateDependency,
	}

	for _, validateFunc := range validateFuncs {
		if errs := validateFunc(appSpec); errs != nil {
			rst = append(rst, errs...)
		}
	}

	return
}
