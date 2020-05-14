package controllers

import (
	"context"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	"k8s.io/apimachinery/pkg/api/errors"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"testing"
)

type HttpsCertControllerSuite struct {
	BasicSuite
}

func TestHttpsCertControllerSuite(t *testing.T) {
	suite.Run(t, new(HttpsCertControllerSuite))
}

func (suite *HttpsCertControllerSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()
}

func (suite *HttpsCertControllerSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *HttpsCertControllerSuite) TestBasicCRUD() {

	// prepare httpsCertIssuer
	issuer := genEmptyCAHttpsCertIssuer()
	suite.createHttpsCertIssuer(issuer)

	//create
	httpsCert := genHttpsCert(issuer.Name)
	suite.createHttpsCert(httpsCert)

	//get
	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(
			context.Background(),
			types.NamespacedName{Name: httpsCert.Name, Namespace: httpsCert.Namespace},
			&httpsCert,
		)

		return err == nil
	})

	// secret with prvKey & cert should be generated too
	//suite.Eventually(func() bool {
	//	var sec corev1.Secret
	//	err := suite.K8sClient.Get(context.Background(), types.NamespacedName{
	//		Name: httpsCert.Name,
	//		Namespace: "istio-system",
	//	}, &sec)
	//
	//	if err != nil {
	//		fmt.Println("fail get sec", err)
	//	}
	//
	//	return err == nil
	//	//_, keyExist := sec.Data["tls.key"]
	//	//_, crtExist := sec.Data["tls.crt"]
	//	//_, caCrtExist := sec.Data["ca.crt"]
	//	//return keyExist && crtExist && caCrtExist
	//})

	// delete
	suite.reloadHttpsCert(&httpsCert)
	suite.Nil(suite.K8sClient.Delete(context.Background(), &httpsCert))

	// Read after deletion
	suite.Eventually(func() bool {
		return errors.IsNotFound(
			suite.K8sClient.Get(
				context.Background(),
				types.NamespacedName{Name: httpsCert.Name, Namespace: httpsCert.Namespace},
				&httpsCert,
			),
		)
	})
}

func (suite *HttpsCertControllerSuite) reloadHttpsCert(httpsCert *v1alpha1.HttpsCert) {
	err := suite.K8sClient.Get(
		context.Background(),
		types.NamespacedName{Name: httpsCert.Name, Namespace: httpsCert.Namespace},
		httpsCert,
	)

	suite.Nil(err)
}

func genHttpsCert(issuer string) v1alpha1.HttpsCert {
	return v1alpha1.HttpsCert{
		ObjectMeta: v1.ObjectMeta{
			Name:      randomName()[:12],
			Namespace: randomName()[:12],
		},
		Spec: v1alpha1.HttpsCertSpec{
			HttpsCertIssuer: issuer,
			Domains:         []string{"a.demo.com", "b.demo.com"},
		},
	}
}

func (suite *HttpsCertControllerSuite) createHttpsCertIssuer(issuer v1alpha1.HttpsCertIssuer) {
	suite.Nil(suite.K8sClient.Create(context.Background(), &issuer))

	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(
			context.Background(),
			types.NamespacedName{Name: issuer.Name, Namespace: issuer.Namespace},
			&issuer,
		)

		return err == nil
	})
}

func (suite *HttpsCertControllerSuite) createHttpsCert(cert v1alpha1.HttpsCert) {
	suite.Nil(suite.K8sClient.Create(context.Background(), &cert))

	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(
			context.Background(),
			types.NamespacedName{Name: cert.Name, Namespace: cert.Namespace},
			&cert,
		)

		return err == nil
	})
}
