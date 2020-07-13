package controllers

import (
	"github.com/go-logr/logr"
	corev1alpha1 "github.com/kalm-staging/kalm/controller/api/v1alpha1"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/tools/record"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

const (
	finalizerName = "storage.finalizers.kalm.dev"
	ownerKey      = ".metadata.controller"
)

var (
	apiGVStr = corev1alpha1.GroupVersion.String()
)

type BaseReconciler struct {
	client.Client
	Reader   client.Reader
	Log      logr.Logger
	Scheme   *runtime.Scheme
	Recorder record.EventRecorder
}

func NewBaseReconciler(mgr ctrl.Manager, name string) *BaseReconciler {
	return &BaseReconciler{
		Client:   mgr.GetClient(),
		Log:      ctrl.Log.WithName("controllers").WithName(name),
		Scheme:   mgr.GetScheme(),
		Reader:   mgr.GetAPIReader(),
		Recorder: mgr.GetEventRecorderFor("ns"),
	}
}

func (r *BaseReconciler) EmitWarningEvent(obj runtime.Object, err error, msg string, args ...interface{}) {
	r.Recorder.Eventf(obj, coreV1.EventTypeWarning, string(errors.ReasonForError(err)), msg, args...)
}

func (r *BaseReconciler) EmitNormalEvent(obj runtime.Object, reason, msg string, args ...interface{}) {
	r.Recorder.Eventf(obj, coreV1.EventTypeNormal, reason, msg, args...)
}
