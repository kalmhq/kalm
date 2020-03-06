package controllers

import (
	"context"
	"fmt"
	corev1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
	cmv1alpha2 "github.com/jetstack/cert-manager/pkg/apis/certmanager/v1alpha2"
	"io/ioutil"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	apiextv1beta1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1beta1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/serializer"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	"log"
	"regexp"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"strings"
)

type DepInstallStatus int

const (
	NotInstalled = iota
	Installing
	InstallFailed
	Installed
)

func (r *DependencyReconciler) getDependencyInstallStatus(namespace string, dpNames ...string) (DepInstallStatus, error) {
	var statusList []DepInstallStatus

	for _, dpName := range dpNames {
		singleDeploymentStatus, err := r.getSingleDpStatusInDependency(namespace, dpName)
		if err != nil {
			return 0, err
		}

		statusList = append(statusList, singleDeploymentStatus)
	}

	if hasStatus(statusList, InstallFailed) {
		return InstallFailed, nil
	}
	if hasStatus(statusList, Installing) {
		return Installing, nil
	}

	if allIsStatus(statusList, Installed) {
		return Installed, nil
	}
	if allIsStatus(statusList, NotInstalled) {
		return NotInstalled, nil
	}

	return Installing, nil
}

func hasStatus(statusList []DepInstallStatus, target DepInstallStatus) bool {
	for _, status := range statusList {
		if status == target {
			return true
		}
	}

	return false
}

func allIsStatus(statusList []DepInstallStatus, target DepInstallStatus) bool {
	if len(statusList) < 0 {
		return false
	}

	for _, status := range statusList {
		if status != target {
			return false
		}
	}

	return true
}

// todo more strict check
// currently only check if given dp exist under ns
func (r *DependencyReconciler) getSingleDpStatusInDependency(namespace, dpName string) (DepInstallStatus, error) {
	dpList := appsv1.DeploymentList{}
	if err := r.List(context.TODO(), &dpList, client.InNamespace(namespace)); err != nil {
		return 0, err
	}

	for _, dp := range dpList.Items {
		if dp.Name != dpName {
			continue
		}

		if len(dp.Status.Conditions) <= 0 {
			return Installing, nil
		}

		// todo first or last?
		latestCondition := dp.Status.Conditions[0]

		conditionType := latestCondition.Type
		conditionStatus := latestCondition.Status

		switch conditionType {
		case appsv1.DeploymentAvailable:
			if conditionStatus == corev1.ConditionTrue {
				return Installed, nil
			} else {
				return Installing, nil
			}
		case appsv1.DeploymentProgressing:
			return Installing, nil
		case appsv1.DeploymentReplicaFailure:
			return InstallFailed, nil
		}
	}

	return NotInstalled, nil
}

func (r *DependencyReconciler) reconcileExternalController(ctx context.Context, fileName string) error {
	//load yaml for external-controller
	file := loadFile(fileName)
	objs := parseK8sYaml(file)

	// only create, no update yet
	return r.createMany(ctx, objs...)
}

func loadFile(fileName string) []byte {
	// todo more search paths
	dat, err := ioutil.ReadFile(fmt.Sprintf("./resources/%s", fileName))
	if err != nil {
		fmt.Println("err loadFile:", err)
		return nil
	}

	return dat
}

// ref: https://github.com/kubernetes/client-go/issues/193#issuecomment-363318588
func parseK8sYaml(fileR []byte) []runtime.Object {

	acceptedK8sTypes := regexp.MustCompile(`(ValidatingWebhookConfiguration|MutatingWebhookConfiguration|CustomResourceDefinition|ConfigMap|Service|Deployment|Namespace|Role|ClusterRole|RoleBinding|ClusterRoleBinding|ServiceAccount)`)
	fileAsString := string(fileR[:])
	sepYamlFiles := strings.Split(fileAsString, "---")
	retVal := make([]runtime.Object, 0, len(sepYamlFiles))
	for _, f := range sepYamlFiles {
		if f == "\n" || f == "" {
			// ignore empty cases
			continue
		}

		if isCommentOnly(f) {
			continue
		}

		// todo
		sch := runtime.NewScheme()
		_ = clientgoscheme.AddToScheme(sch)
		_ = corev1alpha1.AddToScheme(sch)
		_ = cmv1alpha2.AddToScheme(sch)
		_ = apiextv1beta1.AddToScheme(sch)

		decode := serializer.NewCodecFactory(sch).UniversalDeserializer().Decode
		obj, groupVersionKind, err := decode([]byte(f), nil, nil)

		if err != nil {
			log.Println(fmt.Sprintf("Error while decoding YAML object(%s). Err was: %s", f, err))
			continue
		}

		if !acceptedK8sTypes.MatchString(groupVersionKind.Kind) {
			log.Printf("The custom-roles configMap contained K8s object types which are not supported! Skipping object with type: %s", groupVersionKind.Kind)
		} else {
			retVal = append(retVal, obj)
		}
	}

	return retVal
}

func isCommentOnly(f string) bool {
	f = strings.TrimSpace(f)

	lines := strings.Split(f, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line != "" && line != "\n" && !strings.HasPrefix(line, "#") {
			return false
		}

	}

	return true
}

func (r *DependencyReconciler) createMany(ctx context.Context, objs ...runtime.Object) error {
	for i, obj := range objs {
		if err := r.Create(ctx, obj); err != nil {
			r.Log.Error(err, "fail when createMany",
				"i", i,
				"obj", fmt.Sprintf("%+v", obj),
			)

			return err
		}
	}

	return nil
}
