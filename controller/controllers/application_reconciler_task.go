package controllers

// There will be a new Task instance for each reconciliation

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
