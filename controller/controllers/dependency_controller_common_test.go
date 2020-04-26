package controllers

import (
	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v2"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"strings"
	"testing"
)

func TestLoadFiles(t *testing.T) {
	files, _ := loadFiles("/kube-prometheus/setup")

	//fmt.Println(len(files))

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

var dat = `
apiVersion: v1
items:
- apiVersion: v1
  kind: ConfigMap
  metadata:
    name: grafana-dashboard-apiserver
    namespace: kapp-monitoring
- apiVersion: v1
  kind: ConfigMap
  metadata:
    name: grafana-dashboard-apiserver2
    namespace: kapp-monitoring
kind: ConfigMapList
`

func TestYamlDecode(t *testing.T) {

	m := make(map[string]interface{})
	_ = yaml.NewDecoder(strings.NewReader(dat)).Decode(&m)

	k := m["kind"]
	v, yes := k.(string)
	assert.True(t, yes)
	assert.Equal(t, "ConfigMapList", v)

	itms := m["items"]
	items, ok := itms.([]interface{})
	assert.True(t, ok)
	assert.Equal(t, 2, len(items))

	for _, item := range items {
		//fmt.Println(i, item)
		_, _ = yaml.Marshal(item)
		//fmt.Println(string(out), err)
	}
}

func TestParseK8sYaml2(t *testing.T) {
	objs := parseK8sYaml([]byte(dat))
	for _, obj := range objs {
		_, yes := obj.(metav1.Object)
		assert.True(t, yes)
	}

	assert.Equal(t, 2, len(objs))
}
