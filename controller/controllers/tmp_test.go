package controllers

import (
	"context"
	"fmt"
	"github.com/jetstack/cert-manager/pkg/api"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/assert"
	"io/ioutil"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/api/policy/v1beta1"
	rbacV1 "k8s.io/api/rbac/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"testing"
)

func TestAA(t *testing.T) {
	config := &rest.Config{
		Host: "127.0.0.1:57024",
		// gotta go fast during tests -- we don't really care about overwhelming our test API server
		QPS:   1000.0,
		Burst: 2000.0,
	}

	clientset, err := client.New(config, client.Options{})

	assert.Nil(t, err)
	assert.NotNil(t, clientset)

	decode := api.Codecs.UniversalDeserializer().Decode

	pspRestrictedBytes, _ := ioutil.ReadFile("../../operator/config/psp/psp_restricted.yaml")
	//pspPrivilegedBytes, _ := ioutil.ReadFile("../../operator/config/psp/psp_privileged.yaml")
	roleRestrictedBytes, _ := ioutil.ReadFile("../../operator/config/rbac/psp_restricted_role.yaml")
	//rolePrivilegedBytes, _ := ioutil.ReadFile("../../operator/config/rbac/psp_privileged_role.yaml")

	pspRestricted, _, _ := decode(pspRestrictedBytes, nil, nil)
	//pspPrivileged, _, _ := decode(pspPrivilegedBytes, nil, nil)
	//rolePrivileged, _, _ := decode(rolePrivilegedBytes, nil, nil)
	roleRestricted, _, _ := decode(roleRestrictedBytes, nil, nil)

	err1 := clientset.Create(context.Background(), pspRestricted)
	assert.Nil(t, err1)
	//clientset.Create(context.Background(), pspPrivileged)
	//clientset.Create(context.Background(), rolePrivileged)
	clientset.Create(context.Background(), roleRestricted)

	nsName := "test-ns"
	ns := coreV1.Namespace{
		ObjectMeta: metaV1.ObjectMeta{
			Name: nsName,
		},
	}

	createNsErr := clientset.Create(context.Background(), &ns)
	assert.Nil(t, createNsErr)

	var restrictedPSP v1beta1.PodSecurityPolicy
	//var privilegedPSP v1beta1.PodSecurityPolicy
	restrictedPSPErr := clientset.Get(context.Background(), types.NamespacedName{Name: "kalm-restricted"}, &restrictedPSP)
	//privilegedPSPErr := clientset.Get(context.Background(), types.NamespacedName{Name: "kalm-privileged"}, &privilegedPSP)

	assert.Nil(t, restrictedPSPErr)
	//assert.Nil(t, privilegedPSPErr)

	assert.EqualValues(t, "kalm-restricted", restrictedPSP.Name)
	//assert.EqualValues(t, "kalm-privileged", privilegedPSP.Name)

	var restrictedRole rbacV1.ClusterRole
	//var privilegedRole rbacV1.ClusterRole

	restrictedRoleErr := clientset.Get(context.Background(), types.NamespacedName{Name: "system:psp:restricted"}, &restrictedRole)
	//privilegedRoleErr := clientset.Get(context.Background(), types.NamespacedName{Name: "system:psp:privileged"}, &privilegedRole)

	assert.Nil(t, restrictedRoleErr)
	//assert.Nil(t, privilegedRoleErr)

	assert.EqualValues(t, "system:psp:restricted", restrictedRole.Name)
	//assert.EqualValues(t, "system:psp:privileged", privilegedRole.Name)

	// test clusterrolebinding and psp auth
	// create service account
	sa := coreV1.ServiceAccount{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      "default",
			Namespace: nsName,
		},
		Secrets: []coreV1.ObjectReference{{
			Name: "default-user-token",
		}},
	}

	token := coreV1.Secret{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      "default-user-token",
			Namespace: nsName,
			Annotations: map[string]string{
				"kubernetes.io/service-account.name": "default",
			},
		},
		Type: coreV1.SecretTypeServiceAccountToken,
	}

	createSaErr := clientset.Create(context.Background(), &sa)
	createTokenErr := clientset.Create(context.Background(), &token)

	assert.Nil(t, createSaErr)
	assert.Nil(t, createTokenErr)

	var createdSa coreV1.ServiceAccount
	var createdToken coreV1.Secret
	getSaErr := clientset.Get(context.Background(), types.NamespacedName{Namespace: nsName, Name: sa.Name}, &createdSa)
	getTokenErr := clientset.Get(context.Background(), types.NamespacedName{Namespace: nsName, Name: token.Name}, &createdToken)

	assert.Nil(t, getSaErr)
	assert.Nil(t, getTokenErr)

	pspClusterRoleBinding := rbacV1.ClusterRoleBinding{
		ObjectMeta: metaV1.ObjectMeta{Name: "psp-restricted-role-binding"},
		RoleRef: rbacV1.RoleRef{
			APIGroup: "rbac.authorization.k8s.io",
			Kind:     "ClusterRole",
			Name:     "system:psp:restricted",
		},
		Subjects: []rbacV1.Subject{{
			Kind:      "ServiceAccount",
			Name:      "default",
			Namespace: nsName,
		}},
	}

	clientset.Create(context.Background(), &pspClusterRoleBinding)
	//can not create pod
	isPrivileged := true
	var runAsUser int64
	runAsUser = 0
	podPrivileged := coreV1.Pod{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      "privileged-pod",
			Namespace: nsName,
			Labels: map[string]string{
				v1alpha1.TenantNameLabelKey: "test",
			},
		},
		Spec: coreV1.PodSpec{
			Containers: []coreV1.Container{{
				Name:  "nginx",
				Image: "nginx:latest",
				SecurityContext: &coreV1.SecurityContext{
					Privileged:               &isPrivileged,
					AllowPrivilegeEscalation: &isPrivileged,
					RunAsUser:                &runAsUser,
				},
			}},
			ServiceAccountName: sa.Name,
		},
	}

	configUnAdmin := &rest.Config{
		Host: "127.0.0.1:57024",
		// gotta go fast during tests -- we don't really care about overwhelming our test API server
		QPS:   1000.0,
		Burst: 2000.0,
		Impersonate: rest.ImpersonationConfig{
			UserName: fmt.Sprintf("system:serviceaccount:%s:%s", sa.Namespace, sa.Name),
		},
	}

	clientsetUnAdmin, err := client.New(configUnAdmin, client.Options{})

	errPrivileged := clientsetUnAdmin.Create(context.Background(), &podPrivileged)

	assert.Nil(t, errPrivileged)
}
