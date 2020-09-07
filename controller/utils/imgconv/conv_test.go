package imgconv

import (
	"testing"
)

func TestParseDockerConversionImageName(t *testing.T) {
	testCases := map[string]string{
		"nginx":                               "dockerhub.azk8s.cn/library/nginx",
		"nginx/nginx":                         "dockerhub.azk8s.cn/nginx/nginx",
		"nginx/nginx:alpine":                  "dockerhub.azk8s.cn/nginx/nginx:alpine",
		"example.com/nginx":                   "example.com/nginx",
		"example.com/nginx/nginx":             "example.com/nginx/nginx",
		"example.com/nginx/nginx:latest":      "example.com/nginx/nginx:latest",
		"example.com:1234/nginx/nginx:latest": "example.com:1234/nginx/nginx:latest",
		"k8s.gcr.io/pause-amd64:3.1":          "gcr.azk8s.cn/google_containers/pause-amd64:3.1",
		"gcr.io/pause-amd64:3.1":              "gcr.azk8s.cn/pause-amd64:3.1",
	}

	for k, v := range testCases {
		if Convert(k, CloudAzureChina) != v {
			t.Fatalf("%s convert result is not %s", k, v)
		}
	}
}
