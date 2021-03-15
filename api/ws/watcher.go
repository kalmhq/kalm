package ws

import (
	"context"
	"errors"
	"fmt"

	"github.com/kalmhq/kalm/api/log"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/kalmhq/kalm/controller/controllers"
	"go.uber.org/zap"
	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/apimachinery/pkg/runtime"
	toolscache "k8s.io/client-go/tools/cache"
	"sigs.k8s.io/controller-runtime/pkg/cache"
)

func StartWatching(c *Client) {
	informerCache, err := cache.New(c.clientInfo.Cfg, cache.Options{})
	if err != nil {
		log.Error("new cache error", zap.Error(err))
		return
	}

	fmt.Println("start watching...")

	registerWatchHandler(c, &informerCache, &corev1.Namespace{}, buildNamespaceResMessage)
	registerWatchHandler(c, &informerCache, &corev1.Service{}, buildComponentResMessageCausedByService)
	registerWatchHandler(c, &informerCache, &corev1.Service{}, buildServiceResMessage)
	registerWatchHandler(c, &informerCache, &corev1.Pod{}, buildPodResMessage)
	registerWatchHandler(c, &informerCache, &corev1.Node{}, buildNodeResMessage)
	registerWatchHandler(c, &informerCache, &corev1.PersistentVolumeClaim{}, buildVolumeResMessage)
	registerWatchHandler(c, &informerCache, &batchv1.Job{}, buildJobResMessage)

	registerWatchHandler(c, &informerCache, &v1alpha1.Component{}, buildComponentResMessage)
	registerWatchHandler(c, &informerCache, &v1alpha1.HttpRoute{}, buildHttpRouteResMessage)
	registerWatchHandler(c, &informerCache, &v1alpha1.HttpsCert{}, buildHttpsCertResMessage)
	registerWatchHandler(c, &informerCache, &v1alpha1.DockerRegistry{}, buildRegistryResMessage)
	registerWatchHandler(c, &informerCache, &v1alpha1.SingleSignOnConfig{}, buildSSOConfigResMessage)
	registerWatchHandler(c, &informerCache, &v1alpha1.ProtectedEndpoint{}, buildProtectEndpointResMessage)
	registerWatchHandler(c, &informerCache, &v1alpha1.AccessToken{}, buildAccessTokenResMessage)
	registerWatchHandler(c, &informerCache, &v1alpha1.RoleBinding{}, buildRoleBindingResMessage)
	registerWatchHandler(c, &informerCache, &v1alpha1.ACMEServer{}, buildAcmeServerResMessage)
	registerWatchHandler(c, &informerCache, &v1alpha1.Domain{}, buildDomainResMessage)

	informerCache.Start(c.stopWatcher)
}

func getKindAndKey(obj interface{}) string {
	kind := "unknown"
	if rtObj, ok := obj.(runtime.Object); ok {
		kind = rtObj.GetObjectKind().GroupVersionKind().Kind
	}

	key := "unknown"
	objMeta, err := meta.Accessor(obj)
	if err == nil {
		key = fmt.Sprintf("%s/%s", objMeta.GetNamespace(), objMeta.GetName())
	}

	return fmt.Sprintf("kind: %s, key: %s", kind, key)
}

func registerWatchHandler(c *Client,
	informerCache *cache.Cache,
	runtimeObj runtime.Object,
	buildResMessage func(c *Client, action string, obj interface{}) (*ResMessage, error)) {

	informer, err := (*informerCache).GetInformer(context.Background(), runtimeObj)
	if err != nil {
		log.Error("get informer error", zap.Error(err))
		return
	}

	informer.AddEventHandler(toolscache.ResourceEventHandlerFuncs{
		AddFunc: func(obj interface{}) {
			resMessage, err := buildResMessage(c, "Add", obj)
			if err != nil {
				log.Error("build res message error, Add,", zap.Error(err), zap.Any("obj", getKindAndKey(obj)))
				return
			}

			if resMessage != nil {
				c.sendWatchResMessage(resMessage)
			}
		},
		DeleteFunc: func(obj interface{}) {
			resMessage, err := buildResMessage(c, "Delete", obj)
			if err != nil {
				log.Error("build res message error, Delete,", zap.Error(err), zap.Any("obj", getKindAndKey(obj)))
				return
			}
			if resMessage != nil {
				c.sendWatchResMessage(resMessage)
			}
		},
		UpdateFunc: func(oldObj, obj interface{}) {
			resMessage, err := buildResMessage(c, "Update", obj)
			if err != nil {
				log.Error("build res message error, Update,", zap.Error(err), zap.Any("obj", getKindAndKey(obj)))
				return
			}
			if resMessage != nil {
				c.sendWatchResMessage(resMessage)
			}
		},
	})

}

func buildNamespaceResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	namespace, ok := objWatched.(*corev1.Namespace)
	if !ok {
		return nil, errors.New("convert watch obj to Namespace failed")
	}

	if namespace.Name == resources.KALM_SYSTEM_NAMESPACE {
		return nil, nil
	}

	if _, exist := namespace.Labels[controllers.KalmEnableLabelName]; !exist {
		return nil, nil
	}

	if !c.clientManager.CanViewNamespace(c.clientInfo, namespace.Name) {
		return nil, nil
	}

	builder := c.Builder()
	applicationDetails, err := builder.BuildApplicationDetails(namespace)

	if err != nil {
		return nil, err
	}

	return &ResMessage{
		Namespace: "",
		Kind:      "Application",
		Action:    action,
		Data:      applicationDetails,
	}, nil
}

func componentToResMessage(c *Client, action string, component *v1alpha1.Component) (*ResMessage, error) {
	builder := c.Builder()
	componentDetails, err := builder.BuildComponentDetails(component, nil)
	if err != nil {
		return nil, err
	}

	return &ResMessage{
		Namespace: component.Namespace,
		Kind:      "Component",
		Action:    action,
		Data:      componentDetails,
	}, nil
}

func buildComponentResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	component, ok := objWatched.(*v1alpha1.Component)

	if !ok {
		return nil, errors.New("convert watch obj to Component failed")
	}

	if !c.clientManager.CanViewNamespace(c.clientInfo, component.Namespace) {
		return nil, nil
	}

	return componentToResMessage(c, action, component)
}

func buildComponentResMessageCausedByService(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	service, ok := objWatched.(*corev1.Service)
	if !ok {
		return nil, errors.New("convert watch obj to Service failed")
	}

	componentName := service.Labels["kalm-component"]

	if componentName == "" {
		return nil, nil
	}

	if !c.clientManager.CanViewNamespace(c.clientInfo, service.Namespace) {
		return nil, nil
	}

	component, err := c.Builder().GetComponent(service.Namespace, componentName)

	if err != nil {
		return nil, err
	}

	return componentToResMessage(c, "Update", component)
}

func buildServiceResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	service, ok := objWatched.(*corev1.Service)

	if !ok {
		return nil, errors.New("convert watch obj to Service failed")
	}

	if !c.clientManager.CanViewNamespace(c.clientInfo, service.Namespace) {
		return nil, nil
	}

	return &ResMessage{
		Kind:   "Service",
		Action: action,
		Data:   resources.BuildServiceResponse(service),
	}, nil
}

func buildPodResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	pod, ok := objWatched.(*corev1.Pod)
	if !ok {
		return nil, errors.New("convert watch obj to Pod failed")
	}

	componentName := pod.Labels["kalm-component"]
	if componentName == "" {
		return &ResMessage{}, nil
	}

	if !c.clientManager.CanViewNamespace(c.clientInfo, pod.Namespace) {
		return nil, nil
	}

	component, err := c.Builder().GetComponent(pod.Namespace, componentName)
	if err != nil {
		return nil, err
	}

	return componentToResMessage(c, "Update", component)
}

func buildHttpRouteResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	route, ok := objWatched.(*v1alpha1.HttpRoute)
	if !ok {
		return nil, errors.New("convert watch obj to Node failed")
	}

	if !c.clientManager.CanOperateHttpRoute(c.clientInfo, "view", &resources.HttpRoute{
		Name:          route.Name,
		HttpRouteSpec: &route.Spec,
	}) {
		log.Info("permission denied", zap.Any("route", route))
		return nil, nil
	}

	return &ResMessage{
		Kind:   "HttpRoute",
		Action: action,
		Data:   resources.BuildHttpRouteFromResource(route),
	}, nil
}

func buildNodeResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	node, ok := objWatched.(*corev1.Node)

	if !ok {
		return nil, errors.New("convert watch obj to Node failed")
	}

	if !c.clientManager.CanViewCluster(c.clientInfo) {
		return nil, nil
	}

	return &ResMessage{
		Kind:   "Node",
		Action: action,
		Data:   c.Builder().BuildNodeResponse(node),
	}, nil
}

func buildHttpsCertResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	httpsCert, ok := objWatched.(*v1alpha1.HttpsCert)

	if !ok {
		return nil, errors.New("convert watch obj to HttpsCert failed")
	}

	// TODO: certs are required to support http route
	// if !c.clientManager.CanManageCluster(c.clientInfo) {
	// 	return nil, nil
	// }

	return &ResMessage{
		Kind:   "HttpsCert",
		Action: action,
		Data:   resources.BuildHttpsCertResponse(httpsCert),
	}, nil
}

func buildRegistryResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	registry, ok := objWatched.(*v1alpha1.DockerRegistry)

	if !ok {
		return nil, errors.New("convert watch obj to Registry failed")
	}

	if !c.clientManager.CanViewCluster(c.clientInfo) {
		return nil, nil
	}

	builder := c.Builder()
	registryRes, err := builder.GetDockerRegistry(registry.Name)

	if err != nil {
		return nil, err
	}

	return &ResMessage{
		Kind:   "Registry",
		Action: action,
		Data:   registryRes,
	}, nil
}

func buildJobResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	job, ok := objWatched.(*batchv1.Job)
	if !ok {
		return nil, errors.New("convert watch obj to Job failed")
	}

	componentName := job.Labels["kalm-component"]
	if componentName == "" {
		return &ResMessage{}, nil
	}

	if !c.clientManager.CanViewNamespace(c.clientInfo, job.Namespace) {
		return nil, nil
	}

	component, err := c.Builder().GetComponent(job.Namespace, componentName)
	if err != nil {
		return nil, err
	}

	return componentToResMessage(c, "Update", component)
}

func buildVolumeResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	pvc, ok := objWatched.(*corev1.PersistentVolumeClaim)
	if !ok {
		return nil, errors.New("convert watch obj to PersistentVolume failed")
	}

	label := pvc.Labels["kalm-managed"]
	if label != "true" {
		return &ResMessage{}, nil
	}

	builder := c.Builder()

	//var pv coreV1.PersistentVolume
	//if action == "Delete" {
	//	pv = coreV1.PersistentVolume{}
	//} else {
	//	if err := builder.Get("", pvc.Spec.VolumeName, &pv); err != nil {
	//		return nil, err
	//	}
	//}

	volume, err := builder.BuildVolumeResponse(*pvc)
	if err != nil {
		return nil, err
	}

	return &ResMessage{
		Kind:   "Volume",
		Action: action,
		Data:   volume,
	}, nil
}

func buildSSOConfigResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	ssoConfig, ok := objWatched.(*v1alpha1.SingleSignOnConfig)

	if !ok {
		return nil, errors.New("convert watch obj to SingleSignOnConfig failed")
	}

	if ssoConfig.Name != resources.SSO_NAME {
		// Ignore non SSO_NAME notification
		return nil, nil
	}

	if !c.clientManager.CanViewCluster(c.clientInfo) {
		return nil, nil
	}

	builder := c.Builder()
	ssoConfigRes, err := builder.GetSSOConfig()
	if err != nil {
		return nil, err
	}

	return &ResMessage{
		Kind:   "SingleSignOnConfig",
		Action: action,
		Data:   ssoConfigRes,
	}, nil
}

func buildProtectEndpointResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	endpoint, ok := objWatched.(*v1alpha1.ProtectedEndpoint)

	if !ok {
		return nil, errors.New("convert watch obj to ProtectedEndpoint failed")
	}

	if !c.clientManager.CanViewNamespace(c.clientInfo, endpoint.Namespace) {
		return nil, nil
	}

	return &ResMessage{
		Kind:   "ProtectedEndpoint",
		Action: action,
		Data:   resources.ProtectedEndpointCRDToProtectedEndpoint(endpoint),
	}, nil
}

func buildAccessTokenResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	accessToken, ok := objWatched.(*v1alpha1.AccessToken)

	if !ok {
		return nil, errors.New("convert watch obj to DeployKey failed")
	}

	if accessToken.Labels != nil && accessToken.Labels[resources.AccessTokenTypeLabelKey] == resources.DeployAccessTokenLabelValue {
		if !c.clientManager.PermissionsGreaterThanOrEqualToAccessToken(c.clientInfo, &resources.AccessToken{
			Name:            accessToken.Name,
			AccessTokenSpec: &accessToken.Spec,
		}) {
			return nil, nil
		}

		return &ResMessage{
			Kind:   "DeployAccessToken",
			Action: action,
			Data:   resources.BuildAccessTokenFromResource(accessToken),
		}, nil
	}

	return nil, nil
}

func buildRoleBindingResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	roleBinding, ok := objWatched.(*v1alpha1.RoleBinding)

	if !ok {
		return nil, errors.New("convert watch obj to RoleBinding failed")
	}

	if !c.clientManager.CanManageCluster(c.clientInfo) {
		return nil, nil
	}

	return &ResMessage{
		Kind:   "RoleBinding",
		Action: action,
		Data: &resources.RoleBinding{
			Name:            roleBinding.Name,
			Namespace:       roleBinding.Namespace,
			RoleBindingSpec: &roleBinding.Spec,
		},
	}, nil
}

func buildAcmeServerResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	acmeServer, ok := objWatched.(*v1alpha1.ACMEServer)

	if !ok {
		return nil, errors.New("convert watch obj to AcmeServer failed")
	}

	if !c.clientManager.CanEditCluster(c.clientInfo) {
		return nil, nil
	}

	return &ResMessage{
		Kind:   "ACMEServer",
		Action: action,
		Data:   resources.BuildACMEServerResponse(acmeServer),
	}, nil
}

func buildDomainResMessage(c *Client, action string, objWatched interface{}) (*ResMessage, error) {
	domain, ok := objWatched.(*v1alpha1.Domain)
	if !ok {
		return nil, errors.New("convert watch obj to Domain failed")
	}

	// TODO: certs are required to support http route
	// if !c.clientManager.CanManageCluster(c.clientInfo) {
	// 	return nil, nil
	// }

	return &ResMessage{
		Kind:   "Domain",
		Action: action,
		Data:   resources.WrapDomainAsResp(*domain),
	}, nil
}
