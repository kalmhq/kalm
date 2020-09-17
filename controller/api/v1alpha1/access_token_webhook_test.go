package v1alpha1

import (
	"crypto/sha256"
	"encoding/hex"
	"github.com/stretchr/testify/assert"
	ctrl "sigs.k8s.io/controller-runtime"
	"testing"
)

func TestAccessTokenValidateNameAndToken(t *testing.T) {
	key := AccessToken{
		ObjectMeta: ctrl.ObjectMeta{
			Name: "fake-name",
		},
		Spec: AccessTokenSpec{
			Token: "abc",
		},
	}

	assert.Contains(t, key.validate().Error(), "name and token hash are not matched")
}

func TestAccessTokenValidate(t *testing.T) {

	token := "abcdefghabcdefghabcdefghabcdefghabcdefghabcdefghabcdefghabcdefgh"
	tokenHash := sha256.Sum256([]byte(token))
	name := hex.EncodeToString(tokenHash[:])

	key := AccessToken{
		ObjectMeta: ctrl.ObjectMeta{
			Name: name,
		},
		Spec: AccessTokenSpec{
			Token: token,
		},
	}

	assert.Nil(t, key.validate())
}

func TestAccessTokenValidateRules(t *testing.T) {
	token := "abcdefghabcdefghabcdefghabcdefghabcdefghabcdefghabcdefghabcdefgh"
	tokenHash := sha256.Sum256([]byte(token))
	name := hex.EncodeToString(tokenHash[:])

	key := AccessToken{
		ObjectMeta: ctrl.ObjectMeta{
			Name: name,
		},
		Spec: AccessTokenSpec{
			Token: token,
			Rules: []AccessTokenRule{
				{
					Namespace: "*",
					Name:      "*",
					Kind:      "*",
					Verb:      "*",
				},
			},
		},
	}

	assert.Nil(t, key.validate())
}
