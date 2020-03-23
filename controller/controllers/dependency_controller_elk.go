package controllers

import (
	"context"
	elkcommonv1 "github.com/elastic/cloud-on-k8s/pkg/apis/common/v1"
	elkv1 "github.com/elastic/cloud-on-k8s/pkg/apis/elasticsearch/v1"
	kibanav1 "github.com/elastic/cloud-on-k8s/pkg/apis/kibana/v1"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"

	corev1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
)

func (r *DependencyReconciler) reconcileELK(ctx context.Context, d *corev1alpha1.Dependency) error {

	operatorStatus, err := r.getDependencyInstallStatus("kapp-log", nil, []string{"elastic-operator"})
	if err != nil {
		return err
	}

	switch operatorStatus {
	case NotInstalled:
		// try install Prometheus Operator
		if err := r.reconcileExternalController(ctx, "elk/ECK-all-in-one.yaml"); err != nil {
			return err
		}

		return retryLaterErr
	case Installing:
		r.UpdateStatusIfNotMatch(ctx, d, corev1alpha1.DependencyStatusInstalling)
		return retryLaterErr
	case InstallFailed:
		r.UpdateStatusIfNotMatch(ctx, d, corev1alpha1.DependencyStatusInstallFailed)
		return nil
	case Installed:
		r.Log.Info("ELK operator installed")
	}

	// elastic search
	if err := r.reconcileES(ctx, d); err != nil {
		return err
	}

	// kibana
	if err := r.reconcileKibana(ctx, d); err != nil {
		return err
	}

	// filebeat
	if err := r.reconcileFileBeat(ctx, d); err != nil {
		return err
	}

	return r.UpdateStatusIfNotMatch(ctx, d, corev1alpha1.DependencyStatusRunning)
}

func (r *DependencyReconciler) reconcileES(ctx context.Context, d *corev1alpha1.Dependency) error {
	es, exist, err := r.getElasticSearch(ctx, d)
	if err != nil {
		return err
	}

	if exist {
		r.Log.Info("update es")
		if err := r.Update(ctx, es); err != nil {
			r.Log.Error(err, "fail to update es")
			return err
		}
	} else {
		r.Log.Info("create es")
		if err := r.Create(ctx, es); err != nil {
			r.Log.Error(err, "fail to create es")
			return err
		}
	}

	es, exist, err = r.getElasticSearch(ctx, d)
	if err != nil {
		return err
	}

	// why yellow?
	if !exist || es.Status.Health < elkv1.ElasticsearchYellowHealth {
		return retryLaterErr
	}

	return nil
}

var nsKappLog = "kapp-log"
var esName = "elasticsearch"
var kibanaName = "kibana"

func (r *DependencyReconciler) getElasticSearch(ctx context.Context, d *corev1alpha1.Dependency) (rst *elkv1.Elasticsearch, exist bool, err error) {

	desiredES := desiredElasticSearch(d)

	es := elkv1.Elasticsearch{}
	if err := r.Get(ctx, types.NamespacedName{Namespace: nsKappLog, Name: esName}, &es); err != nil {
		if errors.IsNotFound(err) {
			es = desiredES

			ctrl.SetControllerReference(d, &es, r.Scheme)

			return &es, false, nil
		}

		return nil, false, err
	}

	//make sure matches config
	for i, _ := range desiredES.Spec.NodeSets {
		desiredNodeSet := desiredES.Spec.NodeSets[i]

		es.Spec.NodeSets[i].Name = desiredNodeSet.Name
		es.Spec.NodeSets[i].Count = desiredNodeSet.Count
		es.Spec.NodeSets[i].PodTemplate.Spec = desiredNodeSet.PodTemplate.Spec
		es.Spec.NodeSets[i].Config = desiredNodeSet.Config
	}

	return &es, true, err
}

func desiredElasticSearch(dep *corev1alpha1.Dependency) elkv1.Elasticsearch {
	desiredES := elkv1.Elasticsearch{
		ObjectMeta: v1.ObjectMeta{
			Name:      esName,
			Namespace: nsKappLog,
		},
		Spec: elkv1.ElasticsearchSpec{
			Version: "7.6.1",
			NodeSets: []elkv1.NodeSet{
				{
					Name:  "default",
					Count: 1,
					PodTemplate: corev1.PodTemplateSpec{
						Spec: corev1.PodSpec{
							Containers: []corev1.Container{
								{
									Name: "elasticsearch",
									Env: []corev1.EnvVar{
										{
											Name:  "ES_JAVA_OPTS",
											Value: "-Xms512m -Xmx512m",
										},
									},
									Resources: corev1.ResourceRequirements{
										Limits: corev1.ResourceList{
											"cpu":    resource.MustParse("2"),
											"memory": resource.MustParse("1Gi"),
										},
										Requests: corev1.ResourceList{
											"cpu":    resource.MustParse("0.5"),
											"memory": resource.MustParse("512Mi"),
										},
									},
								},
							},
						},
					},
					Config: &elkcommonv1.Config{
						// todo meaning of these configs
						Data: map[string]interface{}{
							"node.master":           true,
							"node.data":             true,
							"node.ingest":           true,
							"node.store.allow_mmap": false,
						},
					},
				},
			},
		},
	}

	return desiredES
}

func (r *DependencyReconciler) reconcileKibana(ctx context.Context, d *corev1alpha1.Dependency) error {
	k, exist, err := r.getKibana(ctx, d)
	if err != nil {
		return err
	}

	if exist {
		r.Log.Info("update kibana")
		if err := r.Update(ctx, k); err != nil {
			r.Log.Error(err, "fail to update kibana")
			return err
		}
	} else {
		r.Log.Info("create kibana")
		if err := r.Create(ctx, k); err != nil {
			r.Log.Error(err, "fail to create kibana")
			return err
		}
	}

	k, exist, err = r.getKibana(ctx, d)
	if err != nil {
		return err
	}

	if !exist || k.Status.Health != kibanav1.KibanaGreen {
		return retryLaterErr
	}

	if host, exist := d.Spec.Config["kibanaHost"]; exist && host != "" {
		pluginIng := &corev1alpha1.PluginIngress{
			Name:        "kibana",
			Type:        pluginIngress,
			Hosts:       []string{host},
			Namespace:   nsKappLog,
			ServiceName: "kibana-kb-http",
			ServicePort: 5601,
		}

		ing, exist, err := r.getIngress(ctx, d, []*corev1alpha1.PluginIngress{pluginIng})
		if err != nil {
			return err
		}

		if exist {
			err = r.Update(ctx, ing)
		} else {
			err = r.Create(ctx, ing)
		}
		if err != nil {
			return err
		}
	}

	return nil
}

func (r *DependencyReconciler) getKibana(ctx context.Context, d *corev1alpha1.Dependency) (*kibanav1.Kibana, bool, error) {
	desired := r.desiredKibana(d)
	k := kibanav1.Kibana{}

	if err := r.Get(ctx, types.NamespacedName{Namespace: nsKappLog, Name: kibanaName}, &k); err != nil {
		if errors.IsNotFound(err) {
			k = desired
			ctrl.SetControllerReference(d, &k, r.Scheme)

			return &k, false, nil
		}

		return nil, false, err
	}

	k.Spec.ElasticsearchRef = desired.Spec.ElasticsearchRef
	k.Spec.Version = desired.Spec.Version
	k.Spec.Count = desired.Spec.Count
	k.Spec.HTTP = desired.Spec.HTTP

	return &k, true, nil
}

func (r *DependencyReconciler) desiredKibana(d *corev1alpha1.Dependency) kibanav1.Kibana {
	return kibanav1.Kibana{
		ObjectMeta: v1.ObjectMeta{
			Name:      kibanaName,
			Namespace: nsKappLog,
		},
		Spec: kibanav1.KibanaSpec{
			Version: "7.6.1",
			Count:   1,
			ElasticsearchRef: elkcommonv1.ObjectSelector{
				Name: esName,
			},
			// todo only for local test, disable https
			HTTP: elkcommonv1.HTTPConfig{
				TLS: elkcommonv1.TLSOptions{
					SelfSignedCertificate: &elkcommonv1.SelfSignedCertificate{
						Disabled: true,
					},
				},
			},
		},
	}
}

func (r *DependencyReconciler) reconcileFileBeat(ctx context.Context, d *corev1alpha1.Dependency) error {
	if err := r.reconcileConfigMapForFileBeat(ctx, d); err != nil {
		return err
	}

	if err := r.reconcileClusterRolesForFileBeat(ctx, d); err != nil {
		return err
	}

	if err := r.reconcileServiceAccountForFileBeat(ctx, d); err != nil {
		return err
	}

	if err := r.reconcileClusterRoleBindingForFileBeat(ctx, d); err != nil {
		return err
	}

	// ds of filebeat
	if err := r.reconcileDaemonSetForFileBeat(ctx, d); err != nil {
		return err
	}

	return r.UpdateStatusIfNotMatch(ctx, d, corev1alpha1.DependencyStatusRunning)
}

func (r *DependencyReconciler) reconcileConfigMapForFileBeat(ctx context.Context, d *corev1alpha1.Dependency) error {
	cm, exist, err := r.getConfigMapForFileBeat(ctx, d)
	if err != nil {
		return err
	}

	if exist {
		err = r.Update(ctx, cm)
	} else {
		err = r.Create(ctx, cm)
	}

	if err != nil {
		return err
	}

	if _, exist, err = r.getConfigMapForFileBeat(ctx, d); err != nil {
		return err
	} else if !exist {
		return retryLaterErr
	}

	return nil
}

func (r *DependencyReconciler) getConfigMapForFileBeat(ctx context.Context, d *corev1alpha1.Dependency) (*corev1.ConfigMap, bool, error) {

	filebeatYml := `
filebeat.inputs:
- type: container
  paths:
    - /var/log/containers/*.log
  processors:
    - add_kubernetes_metadata:
        host: ${NODE_NAME}
        matchers:
        - logs_path:
            logs_path: "/var/log/containers/"

processors:
  - add_cloud_metadata:
  - add_host_metadata:

output.elasticsearch:
  hosts: ['https://${ELASTICSEARCH_HOST:elasticsearch}:${ELASTICSEARCH_PORT:9200}']
  username: ${ELASTICSEARCH_USERNAME}
  password: ${ELASTICSEARCH_PASSWORD}
  ssl.certificate_authorities:
    - /mnt/elastic/tls.crt
`

	cmName := "filebeat-config"
	desiredCM := corev1.ConfigMap{
		ObjectMeta: v1.ObjectMeta{
			Name:      cmName,
			Namespace: nsKappLog,
			Labels: map[string]string{
				"k8s-app": "filebeat",
			},
		},
		Data: map[string]string{
			"filebeat.yml": filebeatYml,
		},
	}

	cm := corev1.ConfigMap{}
	err := r.Get(ctx, types.NamespacedName{Namespace: nsKappLog, Name: cmName}, &cm)
	if err != nil {
		if errors.IsNotFound(err) {
			cm = desiredCM
			ctrl.SetControllerReference(d, &cm, r.Scheme)

			return &cm, false, nil
		}

		return nil, false, err
	}

	// ensure
	cm.Data = desiredCM.Data

	return &cm, true, nil
}

var crNameForFilebeat = "filebeat"

// todo role & account & roleBinding
func (r *DependencyReconciler) reconcileClusterRolesForFileBeat(ctx context.Context, d *corev1alpha1.Dependency) error {

	desiredCR := rbacv1.ClusterRole{
		ObjectMeta: v1.ObjectMeta{
			Name:      crNameForFilebeat,
			Namespace: nsKappLog,
			Labels: map[string]string{
				"k8s-app": "filebeat",
			},
		},
		Rules: []rbacv1.PolicyRule{
			{
				APIGroups: []string{""},
				Resources: []string{"namespaces", "pods"},
				Verbs:     []string{"get", "watch", "list"},
			},
		},
	}

	cr := rbacv1.ClusterRole{}

	exist := false
	if err := r.Get(ctx, types.NamespacedName{Name: crNameForFilebeat}, &cr); err != nil {
		if errors.IsNotFound(err) {
			cr = desiredCR
			ctrl.SetControllerReference(d, &cr, r.Scheme)
		} else {
			return err
		}
	} else {
		exist = true

		// ensure
		cr.Rules = desiredCR.Rules
	}

	var err error
	if exist {
		err = r.Update(ctx, &cr)
	} else {
		err = r.Create(ctx, &cr)
	}

	return err
}

var saNameForFilebeat = "filebeat"

func (r *DependencyReconciler) reconcileServiceAccountForFileBeat(ctx context.Context, d *corev1alpha1.Dependency) error {

	desiredSA := corev1.ServiceAccount{
		ObjectMeta: v1.ObjectMeta{
			Namespace: nsKappLog,
			Name:      saNameForFilebeat,
			Labels: map[string]string{
				"k8s-app": "filebeat",
			},
		},
	}

	sa := corev1.ServiceAccount{}
	exist := false
	if err := r.Get(ctx, types.NamespacedName{Namespace: nsKappLog, Name: saNameForFilebeat}, &sa); err != nil {
		if errors.IsNotFound(err) {
			sa = desiredSA

			ctrl.SetControllerReference(d, &sa, r.Scheme)
		} else {
			return err
		}
	} else {
		exist = true
	}

	var err error
	if exist {
		err = r.Update(ctx, &sa)
	} else {
		err = r.Create(ctx, &sa)
	}

	//todo get again to check is exist?

	return err
}

var crbNameForFileBeat = "filebeat"

func (r *DependencyReconciler) reconcileClusterRoleBindingForFileBeat(ctx context.Context, d *corev1alpha1.Dependency) error {

	desiredCRB := rbacv1.ClusterRoleBinding{
		ObjectMeta: v1.ObjectMeta{
			Name: crbNameForFileBeat,
		},
		Subjects: []rbacv1.Subject{
			{
				Kind:      "ServiceAccount",
				Name:      saNameForFilebeat,
				Namespace: nsKappLog,
			},
		},
		RoleRef: rbacv1.RoleRef{
			Kind:     "ClusterRole",
			Name:     crNameForFilebeat,
			APIGroup: rbacv1.GroupName,
		},
	}

	crb := rbacv1.ClusterRoleBinding{}
	exist := false
	if err := r.Get(ctx, types.NamespacedName{Name: crbNameForFileBeat}, &crb); err != nil {
		if errors.IsNotFound(err) {
			crb = desiredCRB
			ctrl.SetControllerReference(d, &crb, r.Scheme)
		} else {
			return err
		}
	} else {
		exist = true

		crb.Subjects = desiredCRB.Subjects
		crb.RoleRef = desiredCRB.RoleRef
	}

	var err error
	if exist {
		err = r.Update(ctx, &crb)
	} else {
		err = r.Create(ctx, &crb)
	}

	return err
}

var dsNameFilebeat = "filebeat"

func (r *DependencyReconciler) reconcileDaemonSetForFileBeat(ctx context.Context, d *corev1alpha1.Dependency) error {
	labels := map[string]string{
		"k8s-app": "filebeat",
	}

	terminationGracePeriodSecs := int64(30)
	secRunAsUser := int64(0)
	accessMode600 := int32(0600)

	hostPathTypeDirOrCreate := corev1.HostPathType("DirectoryOrCreate")

	desiredDS := appsv1.DaemonSet{
		ObjectMeta: v1.ObjectMeta{
			Name:      dsNameFilebeat,
			Namespace: nsKappLog,
			Labels: map[string]string{
				"k8s-app": "filebeat",
			},
		},
		Spec: appsv1.DaemonSetSpec{
			Selector: &v1.LabelSelector{
				MatchLabels: labels,
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: v1.ObjectMeta{
					Labels: labels,
				},
				Spec: corev1.PodSpec{
					ServiceAccountName:            saNameForFilebeat,
					TerminationGracePeriodSeconds: &terminationGracePeriodSecs,
					HostNetwork:                   true,
					DNSPolicy:                     corev1.DNSPolicy("ClusterFirstWithHostNet"),
					Containers: []corev1.Container{
						{
							Name:  "filebeat",
							Image: "docker.elastic.co/beats/filebeat:7.6.1",
							Args:  []string{"-c", "/etc/filebeat.yml", "-e"},
							Env: []corev1.EnvVar{
								{Name: "ELASTICSEARCH_HOST", Value: "elasticsearch-es-http"},
								{Name: "ELASTICSEARCH_PORT", Value: "9200"},
								{Name: "ELASTICSEARCH_USERNAME", Value: "elastic"},
								{Name: "ELASTICSEARCH_PASSWORD", ValueFrom: &corev1.EnvVarSource{
									SecretKeyRef: &corev1.SecretKeySelector{
										LocalObjectReference: corev1.LocalObjectReference{Name: "elasticsearch-es-elastic-user"},
										Key:                  "elastic",
									},
								}},
								{Name: "NODE_NAME", ValueFrom: &corev1.EnvVarSource{
									FieldRef: &corev1.ObjectFieldSelector{
										FieldPath: "spec.nodeName",
									},
								}},
							},
							SecurityContext: &corev1.SecurityContext{
								RunAsUser: &secRunAsUser,
							},
							Resources: corev1.ResourceRequirements{
								Limits: corev1.ResourceList{
									corev1.ResourceMemory: resource.MustParse("200Mi"),
								},
								Requests: corev1.ResourceList{
									corev1.ResourceCPU:    resource.MustParse("100m"),
									corev1.ResourceMemory: resource.MustParse("100Mi"),
								},
							},
							VolumeMounts: []corev1.VolumeMount{
								{
									Name:      "config",
									MountPath: "/etc/filebeat.yml",
									ReadOnly:  true,
									SubPath:   "filebeat.yml",
								},
								{
									Name:      "data",
									MountPath: "/usr/share/filebeat/data",
								},
								{
									Name:      "varlibdockercontainers",
									MountPath: "/var/lib/docker/containers",
									ReadOnly:  true,
								},
								{
									Name:      "varlog",
									MountPath: "/var/log",
									ReadOnly:  true,
								},
								{
									Name:      "es-certs",
									MountPath: "/mnt/elastic/tls.crt",
									ReadOnly:  true,
									SubPath:   "tls.crt",
								},
							},
						},
					},
					Volumes: []corev1.Volume{
						{
							Name: "config",
							VolumeSource: corev1.VolumeSource{
								ConfigMap: &corev1.ConfigMapVolumeSource{
									LocalObjectReference: corev1.LocalObjectReference{Name: "filebeat-config"},
									DefaultMode:          &accessMode600,
								},
							},
						},
						{
							Name: "varlibdockercontainers",
							VolumeSource: corev1.VolumeSource{
								HostPath: &corev1.HostPathVolumeSource{
									Path: "/var/lib/docker/containers",
								},
							},
						},
						{
							Name: "varlog",
							VolumeSource: corev1.VolumeSource{
								HostPath: &corev1.HostPathVolumeSource{
									Path: "/var/log",
								},
							},
						},
						{
							Name: "data",
							VolumeSource: corev1.VolumeSource{
								HostPath: &corev1.HostPathVolumeSource{
									Path: "/var/lib/filebeat-data",
									Type: &hostPathTypeDirOrCreate,
								},
							},
						},
						{
							Name: "es-certs",
							VolumeSource: corev1.VolumeSource{
								Secret: &corev1.SecretVolumeSource{
									SecretName: "elasticsearch-es-http-certs-public",
								},
							},
						},
					},
				},
			},
		},
	}

	ds := appsv1.DaemonSet{}
	exist := false
	if err := r.Get(ctx, types.NamespacedName{Name: desiredDS.Name, Namespace: desiredDS.Namespace}, &ds); err != nil {
		if errors.IsNotFound(err) {
			ds = desiredDS
			ctrl.SetControllerReference(d, &ds, r.Scheme)

		} else {
			return err
		}
	} else {
		exist = true

		// ensure
		ds.Spec.Template.Spec.Containers = desiredDS.Spec.Template.Spec.Containers
	}

	var err error
	if exist {
		err = r.Update(ctx, &ds)
	} else {
		err = r.Create(ctx, &ds)
	}

	return err
}
