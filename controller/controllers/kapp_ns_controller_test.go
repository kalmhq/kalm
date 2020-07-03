package controllers

import (
	"context"
	"github.com/stretchr/testify/suite"
	appsV1 "k8s.io/api/apps/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"testing"
	"time"
)

type KappNSControllerSuite struct {
	BasicSuite
}

func TestKappNSControllerSuite(t *testing.T) {
	suite.Run(t, new(KappNSControllerSuite))
}

func (suite *KappNSControllerSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()
}

func (suite *KappNSControllerSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *KappNSControllerSuite) TestKappNSIstioEnabled() {
	ns := suite.SetupKappEnabledNs()

	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: ns.Name}, &ns)

		return err == nil && ns.Labels[IstioInjectionLabelName] == IstioInjectionLabelEnableValue
	}, "can't get deployment")
}

func (suite *KappNSControllerSuite) TestUpdateOfNSWillAffectComponentWithin() {
	ns := suite.SetupKappEnabledNs()

	component := generateEmptyComponent(ns.Name)
	suite.createComponent(component)

	key := types.NamespacedName{
		Namespace: component.Namespace,
		Name:      component.Name,
	}

	var deployment appsV1.Deployment
	suite.Eventually(func() bool {
		return suite.K8sClient.Get(context.Background(), key, &deployment) == nil
	}, "can't get deployment")

	suite.reloadObject(client.ObjectKey{Name: ns.Name}, &ns)

	ns.Labels[KappEnableLabelName] = "false"
	suite.updateObject(&ns)

	suite.Eventually(func() bool {
		return errors.IsNotFound(suite.K8sClient.Get(context.Background(), key, &deployment))
	}, "deployment should be delete when ns is not active")

	<-time.After(1 * time.Second)

	// make ns active again
	suite.reloadObject(types.NamespacedName{Name: ns.Name}, &ns)
	ns.Labels[KappEnableLabelName] = KappEnableLabelValue
	suite.updateObject(&ns)
	suite.Eventually(func() bool {
		return suite.K8sClient.Get(context.Background(), key, &deployment) == nil
	}, "can't get deployment")
}
