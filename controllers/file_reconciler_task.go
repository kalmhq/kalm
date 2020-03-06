package controllers

import (
	"context"
	"fmt"
	"github.com/davecgh/go-spew/spew"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"strings"

	"github.com/go-logr/logr"
	corev1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
	"github.com/kapp-staging/kapp/util"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	ctrl "sigs.k8s.io/controller-runtime"
)

type fileReconcilerTask struct {
	ctx        context.Context
	reconciler *FileReconciler
	file       *corev1alpha1.File
	req        ctrl.Request
	log        logr.Logger
	data       string
	ConfigMaps map[string]*corev1.ConfigMap
}

func newFileReconcilerTask(
	reconciler *FileReconciler,
	file *corev1alpha1.File,
	req ctrl.Request,
) *fileReconcilerTask {
	return &fileReconcilerTask{
		context.Background(),
		reconciler,
		file,
		req,
		reconciler.Log,
		"",
		make(map[string]*corev1.ConfigMap),
	}
}

func (task *fileReconcilerTask) Run() (err error) {
	log := task.log

	if shouldFinishReconcilation, err := task.handleDelete(); err != nil || shouldFinishReconcilation {
		if err != nil {
			log.Error(err, "unable to delete File")
		}
		return err
	}

	err = task.loadConfigMaps()

	if err != nil {
		task.log.Error(err, "load config maps failed")
		return err
	}

	shouldCreated := task.calculateShouldCreated()

	spew.Dump("shouldCreated", shouldCreated)

	if shouldCreated != nil {
		err := task.reconciler.Create(task.ctx, shouldCreated)
		if err != nil {
			task.log.Error(err, "create config map failed")
		}
	}

	shouldUpdate := task.calculateShouldUpdated()

	if shouldUpdate != nil {
		// TODO
	}

	//task.reconciler.Create(ctx, config)

	return nil
}

func getConfigMapNameFromPath(path string) string {
	parts := strings.Split(path, "/")
	return fmt.Sprintf("config-%s-dir", strings.Join(parts[1:len(parts)-1], "-"))
}

func getConfigMapDataKeyFromPath(path string) string {
	parts := strings.Split(path, "/")
	return parts[len(parts)-1]
}

func newConfigMapFromFile(file *corev1alpha1.File) *corev1.ConfigMap {
	return &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{
			Name:      getConfigMapNameFromPath(file.Spec.Path),
			Namespace: file.Namespace,
		},
		Data: map[string]string{
			getConfigMapDataKeyFromPath(file.Spec.Path): file.Spec.Content,
		},
	}
}

func (task *fileReconcilerTask) calculateShouldCreated() *corev1.ConfigMap {
	path := task.file.Spec.Path

	if _, exist := task.ConfigMaps[getConfigMapNameFromPath(path)]; !exist {
		return newConfigMapFromFile(task.file)
	} else {
		return nil
	}
}

func (task *fileReconcilerTask) calculateShouldUpdated() *corev1.ConfigMap {
	path := task.file.Spec.Path

	if configMap, exist := task.ConfigMaps[getConfigMapNameFromPath(path)]; !exist {
		return nil
	} else {
		key := getConfigMapDataKeyFromPath(path)
		if content, exist := configMap.Data[key]; exist && content == task.file.Spec.Content {
			return nil
		}
		configMap.Data[key] = task.file.Spec.Content
		return configMap
	}
}

func (task *fileReconcilerTask) loadConfigMaps() error {
	var configMapList corev1.ConfigMapList

	if err := task.reconciler.List(
		task.ctx,
		&configMapList,
		client.InNamespace(task.req.Namespace),
		client.MatchingFields{
			ownerKey: task.req.Name,
		},
	); err != nil {
		task.log.Error(err, "unable to list child config-maps")
		return err
	}

	for i := range configMapList.Items {
		configMap := configMapList.Items[i]
		task.ConfigMaps[configMap.Name] = &configMap
	}

	return nil
}

func (task *fileReconcilerTask) handleDelete() (shouldFinishReconcilationm bool, err error) {
	file := task.file
	ctx := task.ctx

	if file.ObjectMeta.DeletionTimestamp.IsZero() {
		if !util.ContainsString(file.ObjectMeta.Finalizers, finalizerName) {
			file.ObjectMeta.Finalizers = append(file.ObjectMeta.Finalizers, finalizerName)
			if err := task.reconciler.Update(context.Background(), file); err != nil {
				return true, err
			}
		}
	} else {
		if util.ContainsString(file.ObjectMeta.Finalizers, finalizerName) {
			// TODO delete related resources here
			file.ObjectMeta.Finalizers = util.RemoveString(file.ObjectMeta.Finalizers, finalizerName)
			if err := task.reconciler.Update(ctx, file); err != nil {
				return true, err
			}
		}

		return true, nil
	}
	return false, nil
}

// func (act *fileReconcilerTask) getConfigMap(name string) *corev1.ConfigMap {
// 	act.reconciler.ConfigMap.Name
// }
