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

	if shouldFinishReconcilation, err := act.handleDelete(); err != nil || shouldFinishReconcilation {
		if err != nil {
			log.Error(err, "unable to delete File")
		}
		return err
	}

	config := act.reconciler.ConfigMap
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
	act.reconciler.Create(ctx, config)

	return nil
}

func (act *fileReconcilerTask) handleDelete() (shouldFinishReconcilationm bool, err error) {
	file := act.file
	ctx := act.ctx

	if file.ObjectMeta.DeletionTimestamp.IsZero() {
		if !util.ContainsString(file.ObjectMeta.Finalizers, finalizerName) {
			file.ObjectMeta.Finalizers = append(file.ObjectMeta.Finalizers, finalizerName)
			if err := act.reconciler.Update(context.Background(), file); err != nil {
				return true, err
			}
		}
	} else {
		if util.ContainsString(file.ObjectMeta.Finalizers, finalizerName) {
			if err := act.reconciler.Delete(ctx, file); err != nil {
				// if fail to delete the external dependency here, return with error
				// so that it can be retried
				return true, err
			}
			file.ObjectMeta.Finalizers = util.RemoveString(file.ObjectMeta.Finalizers, finalizerName)
			if err := act.reconciler.Update(ctx, file); err != nil {
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
