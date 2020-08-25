package v1alpha1

import (
	ctrl "sigs.k8s.io/controller-runtime"
	"testing"
)

func TestEmptyLogSystemDefaultWebhook(t *testing.T) {
	logSystem := LogSystem{
		ObjectMeta: ctrl.ObjectMeta{
			Name:      "test",
			Namespace: "test",
		},
		Spec: LogSystemSpec{
			Stack: LogSystemStackPLGMonolithic,
		},
	}

	logSystem.Default()

	if logSystem.Spec.PLGConfig.Loki.Image != LokiImage {
		t.Fatalf("should set loki default image")
	}

	if logSystem.Spec.PLGConfig.Grafana.Image != GrafanaImage {
		t.Fatalf("should set grafana default image")
	}

	if logSystem.Spec.PLGConfig.Promtail.Image != PromtailImage {
		t.Fatalf("should set promtail default image")
	}

	if err := logSystem.validate(); err != nil {
		t.Fatalf("the logsystem should be vaild after default mutating. Err: %+v", err)
	}
}

func TestExistingLogSystemDefaultWebhook(t *testing.T) {
	fakeImage := "fake/image:latest"

	logSystem := LogSystem{
		ObjectMeta: ctrl.ObjectMeta{
			Name:      "test",
			Namespace: "test",
		},
		Spec: LogSystemSpec{
			Stack: LogSystemStackPLGMonolithic,
			PLGConfig: &PLGConfig{
				Loki: &LokiConfig{
					Image: fakeImage,
				},
				Promtail: &PromtailConfig{
					Image: fakeImage,
				},
				Grafana: &GrafanaConfig{
					Image: fakeImage,
				},
			},
		},
	}

	logSystem.Default()

	if logSystem.Spec.PLGConfig.Loki.Image != fakeImage {
		t.Fatalf("should not change loki image")
	}

	if logSystem.Spec.PLGConfig.Grafana.Image != fakeImage {
		t.Fatalf("should not grafana loki image")
	}

	if logSystem.Spec.PLGConfig.Promtail.Image != fakeImage {
		t.Fatalf("should not promtail loki image")
	}

	if err := logSystem.validate(); err != nil {
		t.Fatalf("the logsystem should be vaild after default mutating. Err: %+v", err)
	}
}
