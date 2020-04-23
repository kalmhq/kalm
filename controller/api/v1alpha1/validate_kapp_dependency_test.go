package v1alpha1

//
//func TestIsValidateDependency(t *testing.T) {
//	appSpec := ApplicationSpec{
//		Components: []ComponentSpec{
//			{
//				Name:         "a",
//				StartAfterComponents: []string{"b"},
//			},
//			{
//				Name:         "b",
//				StartAfterComponents: []string{"a"},
//			},
//		},
//	}
//
//	errs := isValidateDependency(appSpec)
//	assert.Equal(t, 2, len(errs))
//}
//
//func TestKappProbeValidator(t *testing.T) {
//	appSpec := ApplicationSpec{
//		Components: []ComponentSpec{
//			{
//				LivenessProbe: &v1.Probe{
//					Handler:             v1.Handler{},
//					InitialDelaySeconds: -1,
//					TimeoutSeconds:      0,
//					PeriodSeconds:       0,
//					SuccessThreshold:    0,
//					FailureThreshold:    0,
//				},
//			},
//		},
//	}
//
//	errList := isValidateProbe(appSpec)
//
//	assert.Equal(t, 2, len(errList))
//
//	assert.Contains(t, errList[0].Error(), "must specify a handler type")
//	assert.Contains(t, errList[1].Error(), "must be greater than or equal to 0")
//}
//
//func TestIsValidateResource(t *testing.T) {
//	goodCPU := resource.MustParse("1000Ki")
//	badCPU := resource.MustParse("1000.0001k")
//
//	appSpec := ApplicationSpec{
//		Components: []ComponentSpec{
//			{
//				CPU: &goodCPU,
//			},
//		},
//	}
//
//	errList := isValidateResource(appSpec)
//	assert.Nil(t, errList)
//
//	appSpec.Components[0].CPU = &badCPU
//	errList = isValidateResource(appSpec)
//	assert.Equal(t, 1, len(errList))
//	assert.Contains(t, errList[0].Error(), "must be an integer")
//}
//
//func TestIsValidateName(t *testing.T) {
//	errs := isValidateName("1foo")
//	assert.Equal(t, 1, len(errs))
//	assert.Contains(t, errs[0].Error(), "a DNS-1035 label must consist of lower case alphanumeric characters")
//}
//
//func TestIsValidateNamespace(t *testing.T) {
//	goodns := "1bar"
//	errs := isValidateNamespace(goodns)
//	assert.Nil(t, errs)
//
//	badNamespace := ".1bar"
//	errs = isValidateNamespace(badNamespace)
//	assert.Equal(t, 1, len(errs))
//	assert.Contains(t, errs[0].Error(), "a DNS-1123 label must consist of lower case")
//}
