package controllers

import (
	"context"
	"fmt"
	"time"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"istio.io/pkg/log"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/tools/cache"
	"k8s.io/client-go/util/workqueue"
	"k8s.io/klog"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/manager"
)

type DomainChecker struct {
	workqueue workqueue.RateLimitingInterface
	client    client.Client
	ctx       context.Context
}

func NewDomainChecker(mgr manager.Manager) (*DomainChecker, error) {
	gvk := schema.GroupVersionKind{
		Group:   v1alpha1.GroupVersion.Group,
		Version: v1alpha1.GroupVersion.Version,
		Kind:    "Domain",
	}

	queue := workqueue.NewNamedRateLimitingQueue(workqueue.DefaultControllerRateLimiter(), "Domain")
	domainChecker := &DomainChecker{workqueue: queue}

	domainInformer, err := mgr.GetCache().GetInformerForKind(context.Background(), gvk)
	if err != nil {
		return nil, err
	}

	domainInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc: domainChecker.enqueue,
	})

	client := mgr.GetClient()

	return &DomainChecker{
		workqueue: queue,
		client:    client,
		ctx:       context.Background(),
	}, nil
}

func (dc *DomainChecker) enqueue(obj interface{}) {
	if key, err := cache.MetaNamespaceKeyFunc(obj); err != nil {
		return
	} else {
		dc.workqueue.Add(key)
	}
}

func (dc *DomainChecker) Run(stopCh <-chan struct{}) error {
	for dc.processNextWorkItem() {
	}

	//todo
	return nil
}

func (c *DomainChecker) processNextWorkItem() bool {
	obj, shutdown := c.workqueue.Get()
	if shutdown {
		return false
	}

	err := func(obj interface{}) error {
		defer c.workqueue.Done(obj)
		var key string
		var ok bool
		if key, ok = obj.(string); !ok {
			c.workqueue.Forget(obj)
			return nil
		}

		if err := c.syncHandler(key); err != nil {
			c.workqueue.AddRateLimited(key)
			return fmt.Errorf("error syncing '%s': %s, requeuing", key, err.Error())
		}

		c.workqueue.Forget(obj)
		klog.Infof("Successfully synced '%s'", key)
		return nil
	}(obj)

	if err != nil {
		return true
	}

	return true
}

func (c *DomainChecker) syncHandler(key string) error {
	_, name, err := cache.SplitMetaNamespaceKey(key)
	if err != nil {
		return nil
	}

	domain := v1alpha1.Domain{}
	if err := c.client.Get(c.ctx, client.ObjectKey{Name: name}, &domain); err != nil {
		return err
	}

	// do nothing if is kalm builtin domain
	if domain.Spec.IsKalmBuiltinDomain {
		return nil
	}

	isConfiguredAsExpected, err := v1alpha1.IsDomainConfiguredAsExpected(domain.Spec)
	if err != nil {
		return err
	}

	requeueAfter := decideRequeueAfter(domain, isConfiguredAsExpected)

	copied := domain.DeepCopy()

	if isConfiguredAsExpected {
		copied.Status.IsDNSTargetConfigured = true

		if copied.Status.CheckCountSinceCNAMEReadyUpdated > 0 {
			//reset
			copied.Status.CheckCountSinceCNAMEReadyUpdated = 0
		}
	} else {
		// for ready change to not-ready, only set to failed for 10 times
		if copied.Status.IsDNSTargetConfigured {
			copied.Status.CheckCountSinceCNAMEReadyUpdated += 1

			threshold := 10
			if copied.Status.CheckCountSinceCNAMEReadyUpdated > threshold {
				copied.Status.IsDNSTargetConfigured = false
			}
		}
	}

	if err := c.client.Status().Update(c.ctx, copied); err != nil {
		return err
	}

	// this reconcile act as a never ending loop to check if Domain config is Valid
	log.Info("requeue check of Domain", "after", requeueAfter)
	return nil
}

// decide time of next re-check
func decideRequeueAfter(domain v1alpha1.Domain, isReady bool) time.Duration {
	if isReady {
		return 60 * time.Second
	} else {
		return 5 * time.Second
	}
}
