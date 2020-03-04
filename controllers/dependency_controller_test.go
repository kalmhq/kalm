package controllers

import (
	"fmt"
	"testing"
)

func TestParseK8sYaml(t *testing.T) {
	yaml := `
apiVersion: v1
kind: Namespace
metadata:
  name: test-ns`

	rst := parseK8sYaml([]byte(yaml))
	fmt.Println(rst)
}
