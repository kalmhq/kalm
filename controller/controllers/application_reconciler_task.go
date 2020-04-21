package controllers

//
//func (act *applicationReconcilerTask) FindShareEnvValue(name string) (string, error) {
//	for _, env := range act.app.Spec.SharedEnv {
//		if env.Name != name {
//			continue
//		}
//
//		if env.Type == kappV1Alpha1.EnvVarTypeLinked {
//			return act.getValueOfLinkedEnv(env)
//		} else if env.Type == "" || env.Type == kappV1Alpha1.EnvVarTypeStatic {
//			return env.Value, nil
//		}
//
//	}
//
//	return "", fmt.Errorf("fail to find value for shareEnv: %s", name)
//}
//
//
//func (act *applicationReconcilerTask) getValueOfLinkedEnv(env kappV1Alpha1.EnvVar) (string, error) {
//	if env.Value == "" {
//		return env.Value, nil
//	}
//
//	parts := strings.Split(env.Value, "/")
//	if len(parts) != 2 {
//		return "", fmt.Errorf("wrong componentPort config %s, format error", env.Value)
//	}
//
//	service := act.FindService(parts[0])
//	if service == nil {
//		return "", fmt.Errorf("wrong componentPort config %s, service not exist", env.Value)
//	}
//
//	var port int32
//	for _, servicePort := range service.Spec.Ports {
//		if servicePort.Name == parts[1] {
//			port = servicePort.Port
//		}
//	}
//
//	if port == 0 {
//		return "", fmt.Errorf("wrong componentPort config %s, port not exist", env.Value)
//	}
//
//	// svc.ns:port
//	value := fmt.Sprintf("%s.%s:%d", service.Name, act.app.Namespace, port)
//
//	// <prefix>value<suffix>
//	return fmt.Sprintf("%s%s%s", env.Prefix, value, env.Suffix), nil
//}
//
//func GenRulesOfIngressPlugin(plugin *kappV1Alpha1.PluginIngress) (rst []v1beta1.IngressRule) {
//
//	for _, host := range plugin.Hosts {
//		rule := v1beta1.IngressRule{
//			Host: host,
//			IngressRuleValue: v1beta1.IngressRuleValue{
//				HTTP: &v1beta1.HTTPIngressRuleValue{
//					Paths: []v1beta1.HTTPIngressPath{
//						{
//							Path: plugin.Path,
//							Backend: v1beta1.IngressBackend{
//								ServiceName: plugin.ServiceName,
//								ServicePort: intstr.IntOrString{
//									Type:   intstr.Int,
//									IntVal: int32(plugin.ServicePort),
//								},
//							},
//						},
//					},
//				},
//			},
//		}
//
//		rst = append(rst, rule)
//	}
//
//	return
//}
//
//func GetPlugins(kapp *kappV1Alpha1.Application) (plugins []interface{}) {
//	appName := kapp.Name
//
//	for _, componentSpec := range kapp.Spec.Components {
//		for _, raw := range componentSpec.Plugins {
//
//			var tmp struct {
//				Name string `json:"name"`
//				Type string `json:"type"`
//			}
//
//			_ = json.Unmarshal(raw.Raw, &tmp)
//
//			if tmp.Name == "manual-scaler" {
//				var p kappV1Alpha1.PluginManualScaler
//				_ = json.Unmarshal(raw.Raw, &p)
//				plugins = append(plugins, &p)
//				continue
//			}
//
//			switch tmp.Type {
//			case pluginIngress:
//				var ing kappV1Alpha1.PluginIngress
//				_ = json.Unmarshal(raw.Raw, &ing)
//
//				// todo what if not first ports
//				ing.ServicePort = int(componentSpec.Ports[0].ServicePort)
//				if ing.ServicePort == 0 {
//					ing.ServicePort = int(componentSpec.Ports[0].ContainerPort)
//				}
//
//				ing.ServiceName = getServiceName(appName, componentSpec.Name)
//				ing.Namespace = kapp.Namespace
//
//				plugins = append(plugins, &ing)
//				continue
//			}
//		}
//	}
//
//	return
//}
//
//func GetIngressPlugins(kapp *kappV1Alpha1.Application) (rst []*kappV1Alpha1.PluginIngress) {
//	plugins := GetPlugins(kapp)
//
//	for _, plugin := range plugins {
//		v, yes := plugin.(*kappV1Alpha1.PluginIngress)
//
//		if !yes {
//			continue
//		}
//
//		rst = append(rst, v)
//	}
//
//	return
//}
