package v1alpha1

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetDirectCNAMEShouldReturnSameResult(t *testing.T) {
	domain := "tst1crmapps.starbucks.com"

	var cname string
	for i := 0; i < 10; i++ {
		tmp := getDirectCNAMEOfDomain(domain)

		if cname != "" {
			assert.Equal(t, cname, tmp)
		}

		cname = tmp
		fmt.Println(cname)
	}
}
