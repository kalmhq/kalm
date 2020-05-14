package registry

import (
	"fmt"
	"github.com/joho/godotenv"
	"io/ioutil"
	"os"
	"testing"
)

func TestRegistry(t *testing.T) {
	// allow this test run from multiple places
	_ = godotenv.Load("../.env")
	_ = godotenv.Load()

	if os.Getenv("KAPP_TEST_DOCKER_REGISTRY_PASSWORD") == "" || os.Getenv("KAPP_TEST_DOCKER_REGISTRY_USERNAME") == "" {
		t.Skip()
	}

	username := os.Getenv("KAPP_TEST_DOCKER_REGISTRY_USERNAME")
	password := os.Getenv("KAPP_TEST_DOCKER_REGISTRY_PASSWORD")

	registry := NewRegistry("https://gcr.io", username, password)
	repos, err := registry.Repositories()

	if err != nil {
		t.Fatal("Can't get repos, error", err)
	}

	for _, repo := range repos {
		tags, _ := registry.Tags(repo)
		for _, tag := range tags {
			//_, _ = fmt.Fprintln(os.Stdout, repo, tag)
			_, _ = fmt.Fprintln(ioutil.Discard, repo, tag)
		}
	}
}
