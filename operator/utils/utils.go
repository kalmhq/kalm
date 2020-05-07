package utils

import (
	"bytes"
	"gopkg.in/yaml.v3"
)

func ContainsString(slice []string, s string) bool {
	for _, item := range slice {
		if item == s {
			return true
		}
	}
	return false
}

func RemoveString(slice []string, s string) (result []string) {
	for _, item := range slice {
		if item == s {
			continue
		}
		result = append(result, item)
	}
	return
}

func SeparateYamlBytes(bts []byte) [][]byte {
	var tmp map[string]interface{}
	r := bytes.NewReader(bts)
	dec := yaml.NewDecoder(r)

	var res [][]byte
	for dec.Decode(&tmp) == nil {
		x, _ := yaml.Marshal(tmp)
		res = append(res, x)
	}

	return res
}
