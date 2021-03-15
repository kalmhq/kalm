package v1alpha1

import (
	"net/url"
	"regexp"
	"strings"

	"github.com/kalmhq/kalm/controller/validation"
	apimachineryvalidation "k8s.io/apimachinery/pkg/api/validation"
	v1validation "k8s.io/apimachinery/pkg/apis/meta/v1/validation"

	//"k8s.io/utils/field"
	"k8s.io/apimachinery/pkg/util/validation/field"

	apimachineryval "k8s.io/apimachinery/pkg/util/validation"
)

func isValidURL(s string) bool {
	u, err := url.Parse(s)
	if err != nil || u.Scheme == "" || u.Host == "" {
		return false
	}

	return true
}

// true:  *
// true:  *.example.com
// false: *.com
// false: a*.example.com
// false: a*b.example.com
func IsValidWildcardDomainInCert(s string) bool {
	if s == "*" {
		return false
	}

	parts := strings.Split(s, ".")
	if len(parts) < 3 {
		return false
	}

	first := parts[0]
	rest := strings.Join(parts[1:], ".")

	return first == "*" && validation.ValidateFQDN(rest) == nil
}

func isValidDomainInCert(s string) bool {
	return validation.ValidateFQDN(s) == nil || IsValidWildcardDomainInCert(s)
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

//https://golangcode.com/validate-an-email-address/
var emailRegex = regexp.MustCompile("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

func isValidEmail(e string) bool {
	if len(e) < 3 && len(e) > 254 {
		return false
	}

	return emailRegex.MatchString(e)
}

func isValidPath(s string) bool {
	return strings.HasPrefix(s, "/")
}
