package v1alpha1

import (
	"github.com/stretchr/testify/assert"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"testing"
)

func TestSingleSignOnConfig_Webhook(t *testing.T) {
	ssoConfig := SingleSignOnConfig{
		ObjectMeta: ctrl.ObjectMeta{
			Namespace: "test-ns",
			Name:      "test-name",
		},
		Spec: SingleSignOnConfigSpec{
			Connectors: []DexConnector{
				{
					Config: &runtime.RawExtension{Raw: []byte(`{"baseURL":"https://git.ddex.io","clientID":"fake-client-id","clientSecret":"fake-sec","groups":["kalm","ddex","bfd"]}`)},
					ID:     "gitlab",
					Name:   "Gitlab",
					Type:   "gitlab",
				},
			},
			Domain: "sso.kapp.live",
		},
	}

	ssoConfig.Default()
	assert.Nil(t, ssoConfig.commonValidate())
}
