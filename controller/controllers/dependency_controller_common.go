package controllers

import (
	"context"
	"fmt"
	monitoringv1 "github.com/coreos/prometheus-operator/pkg/apis/monitoring/v1"
	corev1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
	"github.com/influxdata/influxdb/pkg/slices"
	cmv1alpha2 "github.com/jetstack/cert-manager/pkg/apis/certmanager/v1alpha2"
	"gopkg.in/yaml.v2"
	"io/ioutil"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	apiextv1beta1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1beta1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/serializer"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	//apireg "apiregistration.k8s.io/v1"
	//	apireg "k8s.io/api/apiregistration/v1"
	apiregistration "k8s.io/kube-aggregator/pkg/apis/apiregistration/v1"
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

// todo, support more than just deployments
// stateful set, daemon set, etc...
func (r *DependencyReconciler) getInstallStatus(namespace string, kind string, names ...string) (DepInstallStatus, error) {
	return 0, nil
}

func (r *DependencyReconciler) getDependencyInstallStatus(namespace string, dpNames ...string) (DepInstallStatus, error) {
	var statusList []DepInstallStatus

	for _, dpName := range dpNames {
		singleDeploymentStatus, err := r.getSingleDpStatusInDependency(namespace, dpName)
		if err != nil {
			return 0, err
		}

		r.Log.Info("singleDeploymentStatus", dpName, singleDeploymentStatus)
		statusList = append(statusList, singleDeploymentStatus)
	}

	if hasStatus(statusList, InstallFailed) {
		return InstallFailed, nil
	}
	if hasStatus(statusList, NotInstalled) {
		return NotInstalled, nil
	}
	if hasStatus(statusList, Installing) {
		return Installing, nil
	}

	if allIsStatus(statusList, Installed) {
		return Installed, nil
	}

	return NotInstalled, nil
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

		if dp.Status.ReadyReplicas >= dp.Status.Replicas {
			return Installed, nil
		} else {
			return Installing, nil
		}

		// todo when is installFailed?

		//if len(dp.Status.Conditions) <= 0 {
		//	return Installing, nil
		//}
		//
		//// todo first or last?
		//latestCondition := dp.Status.Conditions[0]
		//
		//conditionType := latestCondition.Type
		//conditionStatus := latestCondition.Status
		//
		//switch conditionType {
		//case appsv1.DeploymentAvailable:
		//	if conditionStatus == corev1.ConditionTrue {
		//		return Installed, nil
		//	} else {
		//		return Installing, nil
		//	}
		//case appsv1.DeploymentProgressing:
		//	return Installing, nil
		//case appsv1.DeploymentReplicaFailure:
		//	return InstallFailed, nil
		//}
	}

	return NotInstalled, nil
}

func (r *DependencyReconciler) reconcileExternalController(ctx context.Context, fileOrDirName string) error {
	//load yaml for external-controller
	files := loadFiles(fileOrDirName)
	for _, file := range files {
		//r.Log.Info("parsing file", "i", i)

		objs := parseK8sYaml(file)

		// only create, no update yet
		if err := r.createMany(ctx, objs...); err != nil {
			if isAlreadyExistsErr(err) {
				continue
			}

			return err
		}
	}

	return nil
}

func isAlreadyExistsErr(err error) bool {
	if errors.IsAlreadyExists(err) {
		fmt.Println("errors.IsAlreadyExists, err:", err)
		return true
	}

	// todo
	if strings.Contains(err.Error(), "already exists") {
		fmt.Println("isAlreadyExistsErr, str match:", err)
		return true
	}

	return false
}

func loadFiles(fileOrDirName string) (files [][]byte) {
	searchDirs := []string{
		"./resources",
		"/resources",
		"../resources",
	}

	isDir := strings.HasPrefix(fileOrDirName, "/")

	for _, searchDir := range searchDirs {

		if isDir {
			dirPath := fmt.Sprintf("%s%s", searchDir, fileOrDirName)
			fileInfos, err := ioutil.ReadDir(dirPath)
			if err != nil {
				continue
			}

			for _, fileInfo := range fileInfos {
				// only read files directly under this dir
				if fileInfo.IsDir() {
					continue
				}

				// only apply .yaml files
				if !strings.HasSuffix(fileInfo.Name(), ".yaml") &&
					!strings.HasSuffix(fileInfo.Name(), ".yml") {
					continue
				}

				dat, _ := ioutil.ReadFile(fmt.Sprintf("%s/%s", dirPath, fileInfo.Name()))

				files = append(files, dat)
			}
		} else {

			dat, err := ioutil.ReadFile(fmt.Sprintf("%s/%s", searchDir, fileOrDirName))
			if err != nil {
				fmt.Println("err loadFile:", err)
				continue
			}

			files = append(files, dat)
		}

		if len(files) > 0 {
			return
		}
	}

	return
}

// ref: https://github.com/kubernetes/client-go/issues/193#issuecomment-363318588
func parseK8sYaml(fileR []byte) []runtime.Object {

	acceptedK8sTypes := regexp.MustCompile(`(Prometheus|DaemonSet|Alertmanager|Secret|ValidatingWebhookConfiguration|MutatingWebhookConfiguration|CustomResourceDefinition|ConfigMap|Service|Deployment|Namespace|Role|ClusterRole|RoleBinding|ClusterRoleBinding|ServiceAccount)`)
	fileAsString := string(fileR[:])
	sepYamlFiles := strings.Split(fileAsString, "\n---\n")
	retVal := make([]runtime.Object, 0, len(sepYamlFiles))
	for i, f := range sepYamlFiles {
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
		_ = corev1.AddToScheme(sch)
		_ = monitoringv1.AddToScheme(sch)
		apiregistration.AddToScheme(sch)

		decode := serializer.NewCodecFactory(sch).UniversalDeserializer().Decode
		obj, groupVersionKind, err := decode([]byte(f), nil, nil)
		if err != nil {
			log.Println(fmt.Sprintf("Error while decoding YAML object(%d) Err was: %s, obj: %s", i, err, f))
			continue
		}

		//fmt.Println("gkv", groupVersionKind)
		//fmt.Println("obj", obj)

		listShouldSeparate := []string{"RoleList", "ConfigMapList", "RoleBindingList"}

		if !acceptedK8sTypes.MatchString(groupVersionKind.Kind) {
			log.Printf("The custom-roles configMap contained K8s object types which are not supported! Skipping object with type: %s", groupVersionKind.Kind)
		} else if slices.Exists(listShouldSeparate, groupVersionKind.Kind) {
			//todo clean code
			m := make(map[string]interface{})
			if err := yaml.NewDecoder(strings.NewReader(f)).Decode(m); err != nil {
				log.Println("fail decode ***List", err)
				continue
			}

			items, _ := m["items"]
			for _, item := range items.([]interface{}) {
				inYaml, _ := yaml.Marshal(item)
				obj, groupVersionKind, err = decode(inYaml, nil, nil)
				if err != nil {
					log.Println(fmt.Sprintf("Error while decoding ***List YAML object(%d) Err was: %s, obj: %s", i, err, inYaml))
					continue
				}

				retVal = append(retVal, obj)
			}
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
	for _, obj := range objs {
		if err := r.Create(ctx, obj); err != nil {
			//r.Log.Info(err, "fail when createMany",
			//	"i", i,
			//	"obj", fmt.Sprintf("%+v", obj),
			//)

			return err
		}
	}

	return nil
}

func (r *DependencyReconciler) UpdateStatusIfNotMatch(ctx context.Context, dep *corev1alpha1.Dependency, status string) error {
	if dep.Status.Status == status {
		r.Log.Info("same status, ignored",
			"status", status, "dep", dep)
		return nil
	}

	dep.Status = corev1alpha1.DependencyStatus{
		Status: status,
	}

	if err := r.Status().Update(ctx, dep); err != nil {
		if errors.IsConflict(err) {
			r.Log.Info("errors.IsConflict, retry later",
				"err", err, "dep", dep, "status", status)

			return nil
		}

		r.Log.Error(err, "fail to update status")
		return err
	}

	r.Log.Info("finish updating status", "to", status)

	return nil
}
