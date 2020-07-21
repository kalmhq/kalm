package handler

//func (h *ApiHandler) getDeployKeyList() (*v1alpha1.DeployKeyList, error) {
//	k8sClient := getK8sClient(h.clientManager.ClusterConfig)
//	var fetched v1alpha1.ComponentList
//	err := k8sClient.RESTClient().Get().AbsPath("/apis/core.kalm.dev/v1alpha1/namespaces/" + c.Param("applicationName") + "/components").Do().Into(&fetched)
//	if err != nil {
//		return nil, err
//	}
//	return &fetched, nil
//}
