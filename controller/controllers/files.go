package controllers

import (
	"fmt"
	"github.com/kalmhq/kalm/controller/lib/files"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
)

func (r *ComponentReconcilerTask) reconcileDirectConfigs() error {
	if r.component == nil || len(r.component.Spec.DirectConfigs) == 0 {
		return nil
	}

	componentSpec := r.component.Spec

	r.Log.Info("directConfigs",
		"size", len(componentSpec.DirectConfigs),
		"comp", r.component.Name,
	)

	namespace := r.component.Namespace

	var cm coreV1.ConfigMap
	err := r.Reader.Get(r.ctx, types.NamespacedName{
		Namespace: namespace,
		Name:      files.KAPP_CONFIG_MAP_NAME,
	}, &cm)

	var myFiles []*files.File
	for i, directConfig := range componentSpec.DirectConfigs {
		myFiles = append(myFiles, &files.File{
			Path:    fmt.Sprintf("/kalm-direct-configs/%s/%d", r.component.Name, i),
			IsDir:   false,
			Content: directConfig.Content,
		})
	}

	if errors.IsNotFound(err) {
		cm = coreV1.ConfigMap{
			ObjectMeta: metaV1.ObjectMeta{
				Name:      files.KAPP_CONFIG_MAP_NAME,
				Namespace: namespace,
			},
			Data: map[string]string{
				files.KAPP_SLASH_REPLACER: files.KAPP_PERSISTENT_DIR_PLACEHOLDER,
			},
		}

		for _, f := range myFiles {
			files.AddFile(&cm, f)
		}

		err = r.Create(r.ctx, &cm)
		if err != nil {
			r.Log.Error(err, "create kalm config map error")
			return err
		}
	} else if err != nil {
		r.Log.Error(err, "get kalm config map error")
		return err
	} else {

		// ensure
		for _, f := range myFiles {
			files.AddFile(&cm, f, true)
		}

		err = r.Update(r.ctx, &cm)
		if err != nil {
			r.Log.Error(err, "update kalm config map error")
			return err
		}
	}

	return nil
}

func getPathOfDirectConfig(componentName string, idx int) string {
	return fmt.Sprintf("/kalm-direct-configs/%s/%d", componentName, idx)
}
