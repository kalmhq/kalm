package v1alpha1

import (
	"k8s.io/apimachinery/pkg/util/validation/field"
)

//type KalmProbeValidator struct {
//}

//func isValidateProbe(spec ApplicationSpec) (rst KalmValidateErrorList) {
//	//spec := app.Spec
//
//	for _, comp := range spec.Components {
//		errList := validateProbe(comp.LivenessProbe, field.NewPath(".livenessProbe"))
//		rst = append(rst, toKalmValidateErrors(errList)...)
//
//		errList = validateProbe(comp.ReadinessProbe, field.NewPath(".readinessProbe"))
//		rst = append(rst, toKalmValidateErrors(errList)...)
//	}
//
//	return
//}

func toKalmValidateErrors(errList field.ErrorList) (rst []KalmValidateError) {
	for _, err := range errList {
		rst = append(rst, KalmValidateError{
			Err: err.Error(),
			//Err:  fmt.Sprintf("invalid value: %v, %s", err.BadValue, err.Detail),
			Path: err.Field,
		})
	}

	return rst
}

//func isValidateResource(spec ApplicationSpec) (rst KalmValidateErrorList) {
//	//spec := app.Spec
//
//	for i, comp := range spec.Components {
//		if comp.CPU != nil {
//			fld := field.NewPath(fmt.Sprintf(".component[%d].cpu", i))
//			errList := ValidateResourceQuantityValue(*comp.CPU, fld)
//			rst = append(rst, toKalmValidateErrors(errList)...)
//		}
//
//		if comp.Memory != nil {
//			fld := field.NewPath(fmt.Sprintf(".component[%d].memory", i))
//			errList := ValidateResourceQuantityValue(*comp.CPU, fld)
//			rst = append(rst, toKalmValidateErrors(errList)...)
//		}
//	}
//
//	return
//}
