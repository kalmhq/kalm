package controllers

import (
	"fmt"
	"github.com/stretchr/testify/assert"
	"strings"
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

func TestTrimSpace(t *testing.T) {
	s := `# Source: cert-manager/templates/webhook-psp.yaml


`

	s = strings.TrimSpace(s)

	fmt.Println(s)
}
func TestIsCommentOnly(t *testing.T) {
	s := `# Source: cert-manager/templates/webhook-psp.yaml


`
	yes := isCommentOnly(s)
	assert.True(t, yes)
}
