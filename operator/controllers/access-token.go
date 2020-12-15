package controllers

import (
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	installv1alpha1 "github.com/kalmhq/kalm/operator/api/v1alpha1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/rand"
)

func (r *KalmOperatorConfigReconciler) reconcileAccessTokenForSaaS(config *installv1alpha1.KalmOperatorConfig) error {
	tokenList := v1alpha1.AccessTokenList{}

	if err := r.List(r.Ctx, &tokenList); err != nil {
		return err
	}

	// token name is sha256(rand(128))
	// so we only check if a token labels with global tenant is generated
	for _, token := range tokenList.Items {
		tenantName := token.Labels[v1alpha1.TenantNameLabelKey]
		if tenantName == v1alpha1.DefaultSystemTenantName {
			r.Log.Info("accessToken labeled with global tenant is found, create token skipped")
			return nil
		}
	}

	token := rand.String(128)
	name := v1alpha1.GetAccessTokenNameFromToken(token)

	expectedAccessToken := v1alpha1.AccessToken{
		ObjectMeta: metav1.ObjectMeta{
			Name: name,
			Labels: map[string]string{
				v1alpha1.TenantNameLabelKey: v1alpha1.DefaultSystemTenantName,
			},
		},
		Spec: v1alpha1.AccessTokenSpec{
			Memo:  "created by kalm-operator when initializing cluster",
			Token: token,
			Rules: []v1alpha1.AccessTokenRule{
				{
					Kind:      "*",
					Name:      "*",
					Namespace: "*",
					Verb:      "manage",
				},
				{
					Kind:      "*",
					Name:      "*",
					Namespace: "*",
					Verb:      "view",
				},
				{
					Kind:      "*",
					Name:      "*",
					Namespace: "*",
					Verb:      "edit",
				},
			},
			Creator: "kalm-operator",
		},
	}

	return r.Create(r.Ctx, &expectedAccessToken)
}
