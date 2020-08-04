package controllers

import (
	"context"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
	v1 "k8s.io/api/core/v1"
	"k8s.io/api/rbac/v1beta1"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"
	"sort"
	"testing"
)

type DeployKeyControllerSuite struct {
	BasicSuite
	ctx    context.Context
	logger *log.DelegatingLogger
}

func TestDeployKeyControllerSuiteSuite(t *testing.T) {
	suite.Run(t, new(DeployKeyControllerSuite))
}

func (suite *DeployKeyControllerSuite) SetupSuite() {
	suite.BasicSuite.SetupSuite()

	suite.SetupKalmEnabledNs("kalm-system")
	suite.logger = ctrl.Log
}

func (suite *DeployKeyControllerSuite) TearDownSuite() {
	suite.BasicSuite.TearDownSuite()
}

func (suite *DeployKeyControllerSuite) SetupTest() {
	suite.ctx = context.Background()
}

func (suite *DeployKeyControllerSuite) TestDeployKeyScopeComp() {
	curNs := randomName()
	suite.SetupKalmEnabledNs(curNs)

	comp := generateEmptyComponent(curNs)
	suite.createComponent(comp)

	deployKey := v1alpha1.DeployKey{
		ObjectMeta: ctrl.ObjectMeta{
			Name: "deploy-key-" + randomName(),
		},
		Spec: v1alpha1.DeployKeySpec{
			Scope:     v1alpha1.DeployKeyTypeComponent,
			Resources: []string{comp.Namespace + "/" + comp.Name},
		},
	}
	suite.createObject(&deployKey)

	suite.Eventually(func() bool {

		role := v1beta1.Role{}
		roleKey := client.ObjectKey{Name: deployKey.Name, Namespace: curNs}
		err := suite.K8sClient.Get(suite.ctx, roleKey, &role)
		suite.Nil(err)

		roleBinding := v1beta1.RoleBinding{}
		roleBindingKey := client.ObjectKey{Name: deployKey.Name, Namespace: curNs}
		err = suite.K8sClient.Get(suite.ctx, roleBindingKey, &roleBinding)
		suite.Nil(err)

		return len(role.Rules) == 1 &&
			hasSameStrs(role.Rules[0].Resources, []string{"components"}) &&
			hasSameStrs(role.Rules[0].ResourceNames, []string{comp.Name})
	})
}

func hasSameStrs(s1, s2 []string) bool {
	if len(s1) != len(s2) {
		return false
	}

	sort.Strings(s1)
	sort.Strings(s2)

	for i := range s1 {
		if s1[i] != s2[i] {
			return false
		}
	}

	return true
}

func (suite *DeployKeyControllerSuite) TestDeployKeyScopeApp() {
	ns1 := randomName()
	suite.SetupKalmEnabledNs(ns1)

	ns2 := randomName()
	suite.SetupKalmEnabledNs(ns2)

	deployKey := v1alpha1.DeployKey{
		ObjectMeta: ctrl.ObjectMeta{
			Name: "deploy-key-" + randomName(),
		},
		Spec: v1alpha1.DeployKeySpec{
			Scope:     v1alpha1.DeployKeyTypeNamespace,
			Resources: []string{ns1, ns2},
		},
	}
	suite.createObject(&deployKey)

	suite.Eventually(func() bool {
		nsList := []string{ns1, ns2}

		okInAllNS := true
		for _, ns := range nsList {
			role := v1beta1.Role{}
			roleKey := client.ObjectKey{Name: deployKey.Name, Namespace: ns}
			err := suite.K8sClient.Get(suite.ctx, roleKey, &role)
			suite.Nil(err)

			roleBinding := v1beta1.RoleBinding{}
			roleBindingKey := client.ObjectKey{Name: deployKey.Name, Namespace: ns}
			err = suite.K8sClient.Get(suite.ctx, roleBindingKey, &roleBinding)
			suite.Nil(err)

			okInAllNS = okInAllNS &&
				len(role.Rules) == 1 &&
				hasSameStrs(role.Rules[0].Resources, []string{"components"}) &&
				len(role.Rules[0].ResourceNames) == 0
		}

		return okInAllNS
	})
}

func (suite *DeployKeyControllerSuite) TestDeployKeyScopeCluster() {
	nsCnt := 3
	for i := 0; i < nsCnt; i++ {
		ns := randomName()
		suite.SetupKalmEnabledNs(ns)

	}

	var nsList v1.NamespaceList
	err := suite.K8sClient.List(suite.ctx, &nsList, client.MatchingLabels{
		KalmEnableLabelName: KalmEnableLabelValue,
	})
	suite.Nil(err)

	var kalmNSList []string
	for _, ns := range nsList.Items {
		kalmNSList = append(kalmNSList, ns.Name)
	}

	deployKey := v1alpha1.DeployKey{
		ObjectMeta: ctrl.ObjectMeta{
			Name: "deploy-key-" + randomName(),
		},
		Spec: v1alpha1.DeployKeySpec{
			Scope: v1alpha1.DeployKeyTypeCluster,
		},
	}
	suite.createObject(&deployKey)

	suite.Eventually(func() bool {

		okInAllNS := true
		for _, ns := range kalmNSList {
			role := v1beta1.Role{}
			roleKey := client.ObjectKey{Name: deployKey.Name, Namespace: ns}
			err := suite.K8sClient.Get(suite.ctx, roleKey, &role)
			suite.Nil(err)

			roleBinding := v1beta1.RoleBinding{}
			roleBindingKey := client.ObjectKey{Name: deployKey.Name, Namespace: ns}
			err = suite.K8sClient.Get(suite.ctx, roleBindingKey, &roleBinding)
			suite.Nil(err)

			okInAllNS = okInAllNS &&
				len(role.Rules) == 1 &&
				hasSameStrs(role.Rules[0].Resources, []string{"components"}) &&
				len(role.Rules[0].ResourceNames) == 0
		}

		return okInAllNS
	})
}
