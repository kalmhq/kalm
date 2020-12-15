package controllers

import (
	"context"
	"fmt"
	"time"

	"github.com/go-logr/logr"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/tools/cache"
	"k8s.io/client-go/util/workqueue"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/manager"
)

const (
	VerifiedTurnFailedCntThreadhold = 15
	MaxCount                        = 10000
)

type DomainChecker struct {
	workqueue                  workqueue.RateLimitingInterface
	client                     client.Client
	ctx                        context.Context
	failCountMap               map[string]int // for failed
	verifiedTurnFailedCountMap map[string]int // for verified turn into failed
	verifiedCountMap           map[string]int // for verified
	informerHasSynced          func() bool
	log                        logr.Logger
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

	log := ctrl.Log.WithName("DomainChecker")

	return &DomainChecker{
		workqueue:                  queue,
		client:                     client,
		ctx:                        context.Background(),
		failCountMap:               make(map[string]int),
		verifiedTurnFailedCountMap: make(map[string]int),
		verifiedCountMap:           make(map[string]int),
		log:                        log,
		informerHasSynced:          domainInformer.HasSynced,
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
	// Wait for the caches to be synced before starting workers
	dc.log.Info("Waiting for informer caches to sync")
	if ok := cache.WaitForCacheSync(stopCh, dc.informerHasSynced); !ok {
		return fmt.Errorf("failed to wait for caches to sync")
	}

	for dc.processNextWorkItem() {
	}

	return nil
}

func (c *DomainChecker) processNextWorkItem() bool {
	obj, shutdown := c.workqueue.Get()
	c.log.Info("processNextWorkItem", obj, shutdown)

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

		if rst, err := c.syncHandler(key); err != nil {
			c.workqueue.AddRateLimited(key)
			return fmt.Errorf("error syncing '%s': %s, requeuing", key, err.Error())
		} else if rst.RequeueAfter > 0 {
			c.workqueue.AddAfter(key, rst.RequeueAfter)
		} else if rst.Requeue {
			// immediately retry
			c.workqueue.AddRateLimited(key)
		}

		c.workqueue.Forget(obj)
		c.log.Info("Processed", "key", key)
		return nil
	}(obj)

	if err != nil {
		c.log.Info("fail when handle obj, ignored", "err", err, "obj", obj)
		return true
	}

	return true
}

func (c *DomainChecker) syncHandler(key string) (ctrl.Result, error) {
	_, name, err := cache.SplitMetaNamespaceKey(key)
	if err != nil {
		return ctrl.Result{}, nil
	}

	domain := v1alpha1.Domain{}
	if err := c.client.Get(c.ctx, client.ObjectKey{Name: name}, &domain); err != nil {
		if errors.IsNotFound(err) {
			//todo clean up DNSRecord
			return ctrl.Result{}, nil
		}

		return ctrl.Result{}, err
	}

	// do nothing if is kalm builtin domain
	if domain.Spec.IsKalmBuiltinDomain {
		return ctrl.Result{}, nil
	}

	isConfiguredAsExpected, err := v1alpha1.IsDomainConfiguredAsExpected(domain.Spec)
	if err != nil {
		return ctrl.Result{RequeueAfter: 10 * time.Second}, err
	}

	requeueAfter := c.decideRequeueAfter(domain, isConfiguredAsExpected)

	copied := c.decideStatus(domain, isConfiguredAsExpected)
	if err := c.client.Status().Update(c.ctx, copied); err != nil {
		return ctrl.Result{}, err
	}

	// this reconcile act as a never ending loop to check if Domain config is Valid
	c.log.Info("requeue check of Domain", "requeueAfter", requeueAfter)
	return ctrl.Result{RequeueAfter: requeueAfter}, nil
}

func min(m, n int) int {
	if m < n {
		return m
	}

	return n
}

// decide time of next re-check
func (c *DomainChecker) decideRequeueAfter(domain v1alpha1.Domain, isReady bool) time.Duration {
	if isReady {
		cnt := c.verifiedCountMap[domain.Spec.Domain]

		if cnt < 10 {
			return 1 * time.Minute // 1min
		} else {
			return 30 * time.Minute // 30min
		}
	}

	wasReady := domain.Status.IsDNSTargetConfigured
	if wasReady {
		return 60 * time.Second
	}

	failCnt := c.failCountMap[domain.Spec.Domain]
	c.log.Info("failCount", "domain", domain.Spec.Domain, "cnt", failCnt)

	if failCnt <= 60 {
		return 5 * time.Second // last for ~5min
	} else if failCnt <= 120 {
		return 10 * time.Second // last for ~10min
	} else if failCnt <= 180 {
		return 30 * time.Second // last for ~30min
	}

	return 5 * time.Minute
}

func (c *DomainChecker) decideStatus(domain v1alpha1.Domain, isReady bool) *v1alpha1.Domain {

	copied := domain.DeepCopy()

	if isReady {
		//reset fail count
		delete(c.verifiedTurnFailedCountMap, domain.Spec.Domain)
		delete(c.failCountMap, domain.Spec.Domain)

		// inc verified count
		cnt := c.verifiedCountMap[domain.Spec.Domain]
		c.verifiedCountMap[domain.Spec.Domain] = min(cnt+1, MaxCount)

		copied.Status.IsDNSTargetConfigured = true
	} else {
		// reset verifiedCnt
		delete(c.verifiedCountMap, domain.Spec.Domain)

		// for ready change to not-ready, need failCount > threshold
		wasVerified := copied.Status.IsDNSTargetConfigured
		if wasVerified {
			cnt := c.verifiedTurnFailedCountMap[domain.Spec.Domain]

			if cnt <= VerifiedTurnFailedCntThreadhold {
				// won't set to fail, simply inc failCount
				c.verifiedTurnFailedCountMap[domain.Spec.Domain] = cnt + 1
			} else {
				c.log.Info("verified domain change to un-verified", "domain", domain.Spec.Domain, "failCnt", cnt)
				copied.Status.IsDNSTargetConfigured = false

				delete(c.verifiedTurnFailedCountMap, domain.Spec.Domain)
			}
		} else {
			// inc fail count
			cnt := c.failCountMap[domain.Spec.Domain]
			c.failCountMap[domain.Spec.Domain] = min(cnt+1, MaxCount)
		}
	}

	return copied
}
