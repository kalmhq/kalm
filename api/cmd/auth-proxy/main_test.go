package main

import (
	"fmt"
	"testing"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
)

func TestTmp(t *testing.T) {
	mode := v1alpha1.KalmMode("byoc")
	fmt.Println(mode)
	fmt.Println(mode == v1alpha1.KalmModeBYOC)
}
