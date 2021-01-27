package controllers

import (
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/rand"
)

func (r *KalmOperatorConfigReconciler) reconcileRootAccessTokenForBYOC() error {
	memo := "created by kalm-operator when initializing BYOC cluster"
	return r.reconcileRootAccessToken(memo)
}

func (r *KalmOperatorConfigReconciler) reconcileRootAccessTokenForSaaS() error {
	memo := "created by kalm-operator when initializing SaaS cluster"
	return r.reconcileRootAccessToken(memo)
}

func (r *KalmOperatorConfigReconciler) reconcileRootAccessToken(memo string) error {

	tokenList := v1alpha1.AccessTokenList{}
	if err := r.List(r.Ctx, &tokenList); err != nil {
		return err
	}

	// token name is sha256(rand(128))
	// so we only check if a token with given memo is generated
	for _, token := range tokenList.Items {
		if token.Spec.Memo == memo {
			r.Log.Info("accessToken with given memo is found, create token skipped")
			return nil
		}
	}

	token := rand.String(128)
	name := v1alpha1.GetAccessTokenNameFromToken(token)

	expectedAccessToken := v1alpha1.AccessToken{
		ObjectMeta: metav1.ObjectMeta{
			Name: name,
		},
		Spec: v1alpha1.AccessTokenSpec{
			Memo:  memo,
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
