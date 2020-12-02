package v1alpha1

import (
	"fmt"
	"testing"
)

func TestGetDirectCNAME(t *testing.T) {
	domain := "tst1crmapps.starbucks.com"
	s := getDirectCNAMEOfDomain(domain)
	fmt.Println(s)
}
