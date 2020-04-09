package validate

import "github.com/kapp-staging/kapp/api/v1alpha1"

func TryValidateApplication(appSpec v1alpha1.ApplicationSpec) error {
	// for now only check dependency here
	validateFuncs := []func(spec v1alpha1.ApplicationSpec) error{isValidateDependency}

	for _, validateFunc := range validateFuncs {
		if err := validateFunc(appSpec); err != nil {
			return err
		}
	}

	return nil
}
