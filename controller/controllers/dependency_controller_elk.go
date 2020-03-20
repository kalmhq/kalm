package controllers

import (
	"context"
	elkcommonv1 "github.com/elastic/cloud-on-k8s/pkg/apis/common/v1"
	elkv1 "github.com/elastic/cloud-on-k8s/pkg/apis/elasticsearch/v1"
	kibanav1 "github.com/elastic/cloud-on-k8s/pkg/apis/kibana/v1"
	corev1 "k8s.io/api/core/v1"
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

	if !exist || es.Status.Health != elkv1.ElasticsearchGreenHealth {
		return retryLaterErr
	}

	return nil
}

var ns = "kapp-log"
var esName = "elasticsearch"
var kibanaName = "kibana"

func (r *DependencyReconciler) getElasticSearch(ctx context.Context, d *corev1alpha1.Dependency) (rst *elkv1.Elasticsearch, exist bool, err error) {

	desiredES := desiredElasticSearch(d)

	es := elkv1.Elasticsearch{}
	if err := r.Get(ctx, types.NamespacedName{Namespace: ns, Name: esName}, &es); err != nil {
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
			Namespace: ns,
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

	return nil
}

func (r *DependencyReconciler) getKibana(ctx context.Context, d *corev1alpha1.Dependency) (*kibanav1.Kibana, bool, error) {
	desired := r.desiredKibana(d)
	k := kibanav1.Kibana{}

	if err := r.Get(ctx, types.NamespacedName{Namespace: ns, Name: kibanaName}, &k); err != nil {
		if errors.IsNotFound(err) {
			k = desired
			return &k, false, nil
		}

		return nil, false, err
	}

	k.Spec.ElasticsearchRef = desired.Spec.ElasticsearchRef
	k.Spec.Version = desired.Spec.Version
	k.Spec.Count = desired.Spec.Count

	return &k, true, nil
}

func (r *DependencyReconciler) desiredKibana(d *corev1alpha1.Dependency) kibanav1.Kibana {
	return kibanav1.Kibana{
		ObjectMeta: v1.ObjectMeta{
			Name:      kibanaName,
			Namespace: ns,
		},
		Spec: kibanav1.KibanaSpec{
			Version: "7.6.1",
			Count:   1,
			ElasticsearchRef: elkcommonv1.ObjectSelector{
				Name: esName,
			},
		},
	}
}

func (r *DependencyReconciler) reconcileFileBeat(ctx context.Context, d *corev1alpha1.Dependency) error {
	if err := r.reconcileConfigMapForFileBeat(ctx, d); err != nil {
		return err
	}

	// todo role & account & roleBinding
	// todo ds of filebeat

	return nil
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
			Namespace: ns,
			Labels: map[string]string{
				"k8s-app": "filebeat",
			},
		},
		Data: map[string]string{
			"filebeat.yml": filebeatYml,
		},
	}

	cm := corev1.ConfigMap{}
	err := r.Get(ctx, types.NamespacedName{Namespace: ns, Name: cmName}, &cm)
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
