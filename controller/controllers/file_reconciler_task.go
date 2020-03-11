package controllers

import (
	"context"
	"fmt"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/types"
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
	}
}

func (task *fileReconcilerTask) updateConfigMapDataBaseOnFile(configMap *corev1.ConfigMap) error {
	key := getConfigMapDataKeyFromPath(task.file.Spec.Path)

	if content, exist := configMap.Data[key]; exist && content == task.file.Spec.Content {
		return nil
	}
	configMap.Data[key] = task.file.Spec.Content

	err := task.reconciler.Update(task.ctx, configMap)
	if err != nil {
		task.log.Error(err, "update config map failed")
		return err
	}
	return nil
}

func (task *fileReconcilerTask) removeConfigMapDataBaseOnFileAndPath(configMap *corev1.ConfigMap, path string) error {
	key := getConfigMapDataKeyFromPath(path)
	delete(configMap.Data, key)

	if len(configMap.Data) > 0 {
		err := task.reconciler.Update(task.ctx, configMap)
		if err != nil {
			task.log.Error(err, "update config map failed")
			return err
		}
	} else {
		err := task.reconciler.Delete(task.ctx, configMap)
		if err != nil {
			task.log.Error(err, "delete config map failed")
			return err
		}
	}

	return nil
}

func (task *fileReconcilerTask) Run() (err error) {
	log := task.log
	//spew.Dump("task.file.Status.LastPath before", task.file.Status.LastPath)

	if shouldFinishReconcilation, err := task.handleDelete(); err != nil || shouldFinishReconcilation {
		if err != nil {
			log.Error(err, "unable to delete File")
		}
		return err
	}

	configMap := &corev1.ConfigMap{}
	err = task.getCurrentPathConfigMap(configMap)

	if errors.IsNotFound(err) {
		configMap = newConfigMapFromFile(task.file)
		err = task.reconciler.Create(task.ctx, configMap)
		if err != nil {
			task.log.Error(err, "create config map failed")
			return err
		}
	} else if err != nil {
		task.log.Error(err, "get current path config-map failed")
		return err
	}

	err = task.updateConfigMapDataBaseOnFile(configMap)

	if err != nil {
		task.log.Error(err, "update file content into config-map failed")
		return err
	}

	if task.file.Status.LastPath != "" && task.file.Spec.Path != task.file.Status.LastPath {
		configMap := &corev1.ConfigMap{}
		err = task.getLastPathConfigMap(configMap)
		if err != nil {
			task.log.Error(err, "get file last path config map error")
			return err
		}

		err = task.removeConfigMapDataBaseOnFileAndPath(configMap, task.file.Status.LastPath)
		if err != nil {
			task.log.Error(err, "remote config map file data error")
			return err
		}
	}

	task.file.Status.LastPath = task.file.Spec.Path
	err = task.reconciler.Status().Update(task.ctx, task.file)

	if err != nil {
		task.log.Error(err, "update task status failed")
		return err
	}

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

func (task *fileReconcilerTask) getConfigMap(name string, configMap *corev1.ConfigMap) error {
	return task.reconciler.Get(
		task.ctx,
		types.NamespacedName{
			Name:      name,
			Namespace: task.file.Namespace,
		},
		configMap,
	)
}

func (task *fileReconcilerTask) getCurrentPathConfigMap(configMap *corev1.ConfigMap) error {
	name := getConfigMapNameFromPath(task.file.Spec.Path)
	return task.getConfigMap(name, configMap)
}

func (task *fileReconcilerTask) getLastPathConfigMap(configMap *corev1.ConfigMap) error {
	name := getConfigMapNameFromPath(task.file.Status.LastPath)
	return task.getConfigMap(name, configMap)
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

func (task *fileReconcilerTask) deleteRelatedConfigMap() (err error) {
	configMap := &corev1.ConfigMap{}
	err = task.getCurrentPathConfigMap(configMap)

	if err != nil {
		task.log.Error(err, "get file current path config map error")
		return err
	}

	return task.removeConfigMapDataBaseOnFileAndPath(configMap, task.file.Spec.Path)
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
			task.deleteRelatedConfigMap()
			file.ObjectMeta.Finalizers = util.RemoveString(file.ObjectMeta.Finalizers, finalizerName)
			if err := task.reconciler.Update(ctx, file); err != nil {
				return true, err
			}
		}

		return true, nil
	}
	return false, nil
}
