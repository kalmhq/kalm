package controllers

import (
	"fmt"
	"github.com/stretchr/testify/assert"
	"strings"
	"testing"
)

func TestLoadFiles(t *testing.T) {
	files := loadFiles("/kube-prometheus/setup")

	fmt.Println(len(files))

	assert.NotNil(t, files)
	assert.Greater(t, len(files), 0)
}

func TestSplit(t *testing.T) {
	str := `
this
---
is---
`

	parts := strings.Split(str, "\n---\n")
	assert.Equal(t, len(parts), 2)
}
