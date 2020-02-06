package controllers

import (
	"context"

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
	}
}

func (act *fileReconcilerTask) Run() (err error) {
	log := act.log
	file := act.file
	ctx := act.ctx

	log.Info("Run reconciling file", "act", act.file.Data)
	if shouldFinishReconcilation, err := act.handleDelete(); err != nil || shouldFinishReconcilation {
		if err != nil {
			log.Error(err, "unable to delete File")
		}
		return err
	}
	log.Info("reconciling file", "act", act.file.Data)

	config := act.reconciler.ConfigMap
	log.Info("before create  file", "config", config)
	if config == nil || (config.Name != file.Name) {
		config = &corev1.ConfigMap{
			ObjectMeta: metav1.ObjectMeta{
				Name:      file.Name,
				Namespace: file.Namespace,
			},
			Data: map[string]string{
				file.Name: file.Data,
			},
		}
	}
	log.Info("before create  file", "config", config)
	act.reconciler.Create(ctx, config)

	return nil
}

func (act *fileReconcilerTask) handleDelete() (shouldFinishReconcilationm bool, err error) {
	file := act.file
	ctx := act.ctx
	log := act.log

	log.Info("handleDelete 0", "file", file)
	if file.ObjectMeta.DeletionTimestamp.IsZero() {
		log.Info("handleDelete 1", "file", file)
		if !util.ContainsString(file.ObjectMeta.Finalizers, finalizerName) {
			log.Info("handleDelete 2", "file", file)
			file.ObjectMeta.Finalizers = append(file.ObjectMeta.Finalizers, finalizerName)
			log.Info("handleDelete 3", "file", file)
			if err := act.reconciler.Update(context.Background(), file); err != nil {
				log.Info("handleDelete 4", "file", file)
				return true, err
			}
		}
	} else {
		log.Info("handleDelete 5", "file", file)
		if util.ContainsString(file.ObjectMeta.Finalizers, finalizerName) {
			log.Info("handleDelete 6", "file", file)
			if err := act.reconciler.Delete(ctx, file); err != nil {
				// if fail to delete the external dependency here, return with error
				// so that it can be retried
				log.Info("handleDelete 7", "file", file)
				return true, err
			}
		}
		log.Info("handleDelete 8", "file", file)
		return true, nil
	}
	log.Info("handleDelete 9", "file", file)
	return false, nil
}

// func (act *fileReconcilerTask) getConfigMap(name string) *corev1.ConfigMap {
// 	act.reconciler.ConfigMap.Name
// }
