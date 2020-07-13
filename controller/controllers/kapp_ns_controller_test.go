package controllers

import (
	"context"
	"github.com/stretchr/testify/suite"
	appsV1 "k8s.io/api/apps/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/types"
	"testing"
	"time"
)

type KalmNSControllerSuite struct {
	BasicSuite
}

func TestKalmNSControllerSuite(t *testing.T) {
	suite.Run(t, new(KalmNSControllerSuite))
}

func (suite *KalmNSControllerSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()
}

func (suite *KalmNSControllerSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *KalmNSControllerSuite) TestKalmNSIstioEnabled() {
	ns := suite.SetupKalmEnabledNs()

	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: ns.Name}, &ns)

		return err == nil && ns.Labels[IstioInjectionLabelName] == IstioInjectionLabelEnableValue
	}, "ns labels is not updated")
}

func (suite *KalmNSControllerSuite) TestUpdateOfNSWillAffectComponentWithin() {
	ns := suite.SetupKalmEnabledNs()

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

	suite.Eventually(func() bool {
		err := suite.K8sClient.Get(context.Background(), types.NamespacedName{Name: ns.Name}, &ns)

		return err == nil && ns.Labels[IstioInjectionLabelName] == IstioInjectionLabelEnableValue
	}, "ns labels is not updated")

	ns.Labels[KalmEnableLabelName] = "false"
	suite.updateObject(&ns)

	suite.Eventually(func() bool {
		return errors.IsNotFound(suite.K8sClient.Get(context.Background(), key, &deployment))
	}, "deployment should be delete when ns is not active")

	<-time.After(1 * time.Second)

	// make ns active again
	suite.reloadObject(types.NamespacedName{Name: ns.Name}, &ns)
	ns.Labels[KalmEnableLabelName] = KalmEnableLabelValue
	suite.updateObject(&ns)
	suite.Eventually(func() bool {
		return suite.K8sClient.Get(context.Background(), key, &deployment) == nil
	}, "can't get deployment")
}
