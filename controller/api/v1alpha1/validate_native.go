package v1alpha1

import (
	"k8s.io/apimachinery/pkg/util/validation/field"
)

//type KappProbeValidator struct {
//}

//func isValidateProbe(spec ApplicationSpec) (rst KappValidateErrorList) {
//	//spec := app.Spec
//
//	for _, comp := range spec.Components {
//		errList := validateProbe(comp.LivenessProbe, field.NewPath(".livenessProbe"))
//		rst = append(rst, toKappValidateErrors(errList)...)
//
//		errList = validateProbe(comp.ReadinessProbe, field.NewPath(".readinessProbe"))
//		rst = append(rst, toKappValidateErrors(errList)...)
//	}
//
//	return
//}

func toKappValidateErrors(errList field.ErrorList) (rst []KappValidateError) {
	for _, err := range errList {
		rst = append(rst, KappValidateError{
			Err: err.Error(),
			//Err:  fmt.Sprintf("invalid value: %v, %s", err.BadValue, err.Detail),
			Path: err.Field,
		})
	}

	return rst
}

//func isValidateResource(spec ApplicationSpec) (rst KappValidateErrorList) {
//	//spec := app.Spec
//
//	for i, comp := range spec.Components {
//		if comp.CPU != nil {
//			fld := field.NewPath(fmt.Sprintf(".component[%d].cpu", i))
//			errList := ValidateResourceQuantityValue(*comp.CPU, fld)
//			rst = append(rst, toKappValidateErrors(errList)...)
//		}
//
//		if comp.Memory != nil {
//			fld := field.NewPath(fmt.Sprintf(".component[%d].memory", i))
//			errList := ValidateResourceQuantityValue(*comp.CPU, fld)
//			rst = append(rst, toKappValidateErrors(errList)...)
//		}
//	}
//
//	return
//}
