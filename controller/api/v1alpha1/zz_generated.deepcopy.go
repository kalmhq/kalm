// +build !ignore_autogenerated

/*

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// Code generated by controller-gen. DO NOT EDIT.

package v1alpha1

import (
	"k8s.io/api/core/v1"
	"k8s.io/api/rbac/v1beta1"
	"k8s.io/apimachinery/pkg/runtime"
)

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ACMECloudFlareIssuer) DeepCopyInto(out *ACMECloudFlareIssuer) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ACMECloudFlareIssuer.
func (in *ACMECloudFlareIssuer) DeepCopy() *ACMECloudFlareIssuer {
	if in == nil {
		return nil
	}
	out := new(ACMECloudFlareIssuer)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *CAForTestIssuer) DeepCopyInto(out *CAForTestIssuer) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new CAForTestIssuer.
func (in *CAForTestIssuer) DeepCopy() *CAForTestIssuer {
	if in == nil {
		return nil
	}
	out := new(CAForTestIssuer)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *Component) DeepCopyInto(out *Component) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ObjectMeta.DeepCopyInto(&out.ObjectMeta)
	in.Spec.DeepCopyInto(&out.Spec)
	out.Status = in.Status
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new Component.
func (in *Component) DeepCopy() *Component {
	if in == nil {
		return nil
	}
	out := new(Component)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *Component) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ComponentList) DeepCopyInto(out *ComponentList) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ListMeta.DeepCopyInto(&out.ListMeta)
	if in.Items != nil {
		in, out := &in.Items, &out.Items
		*out = make([]Component, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ComponentList.
func (in *ComponentList) DeepCopy() *ComponentList {
	if in == nil {
		return nil
	}
	out := new(ComponentList)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *ComponentList) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ComponentPlugin) DeepCopyInto(out *ComponentPlugin) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ObjectMeta.DeepCopyInto(&out.ObjectMeta)
	in.Spec.DeepCopyInto(&out.Spec)
	out.Status = in.Status
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ComponentPlugin.
func (in *ComponentPlugin) DeepCopy() *ComponentPlugin {
	if in == nil {
		return nil
	}
	out := new(ComponentPlugin)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *ComponentPlugin) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ComponentPluginBinding) DeepCopyInto(out *ComponentPluginBinding) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ObjectMeta.DeepCopyInto(&out.ObjectMeta)
	in.Spec.DeepCopyInto(&out.Spec)
	out.Status = in.Status
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ComponentPluginBinding.
func (in *ComponentPluginBinding) DeepCopy() *ComponentPluginBinding {
	if in == nil {
		return nil
	}
	out := new(ComponentPluginBinding)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *ComponentPluginBinding) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ComponentPluginBindingList) DeepCopyInto(out *ComponentPluginBindingList) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ListMeta.DeepCopyInto(&out.ListMeta)
	if in.Items != nil {
		in, out := &in.Items, &out.Items
		*out = make([]ComponentPluginBinding, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ComponentPluginBindingList.
func (in *ComponentPluginBindingList) DeepCopy() *ComponentPluginBindingList {
	if in == nil {
		return nil
	}
	out := new(ComponentPluginBindingList)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *ComponentPluginBindingList) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ComponentPluginBindingSpec) DeepCopyInto(out *ComponentPluginBindingSpec) {
	*out = *in
	if in.Config != nil {
		in, out := &in.Config, &out.Config
		*out = new(runtime.RawExtension)
		(*in).DeepCopyInto(*out)
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ComponentPluginBindingSpec.
func (in *ComponentPluginBindingSpec) DeepCopy() *ComponentPluginBindingSpec {
	if in == nil {
		return nil
	}
	out := new(ComponentPluginBindingSpec)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ComponentPluginBindingStatus) DeepCopyInto(out *ComponentPluginBindingStatus) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ComponentPluginBindingStatus.
func (in *ComponentPluginBindingStatus) DeepCopy() *ComponentPluginBindingStatus {
	if in == nil {
		return nil
	}
	out := new(ComponentPluginBindingStatus)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ComponentPluginList) DeepCopyInto(out *ComponentPluginList) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ListMeta.DeepCopyInto(&out.ListMeta)
	if in.Items != nil {
		in, out := &in.Items, &out.Items
		*out = make([]ComponentPlugin, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ComponentPluginList.
func (in *ComponentPluginList) DeepCopy() *ComponentPluginList {
	if in == nil {
		return nil
	}
	out := new(ComponentPluginList)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *ComponentPluginList) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ComponentPluginSpec) DeepCopyInto(out *ComponentPluginSpec) {
	*out = *in
	if in.AvailableWorkloadType != nil {
		in, out := &in.AvailableWorkloadType, &out.AvailableWorkloadType
		*out = make([]WorkloadType, len(*in))
		copy(*out, *in)
	}
	if in.ConfigSchema != nil {
		in, out := &in.ConfigSchema, &out.ConfigSchema
		*out = new(runtime.RawExtension)
		(*in).DeepCopyInto(*out)
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ComponentPluginSpec.
func (in *ComponentPluginSpec) DeepCopy() *ComponentPluginSpec {
	if in == nil {
		return nil
	}
	out := new(ComponentPluginSpec)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ComponentPluginStatus) DeepCopyInto(out *ComponentPluginStatus) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ComponentPluginStatus.
func (in *ComponentPluginStatus) DeepCopy() *ComponentPluginStatus {
	if in == nil {
		return nil
	}
	out := new(ComponentPluginStatus)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ComponentSpec) DeepCopyInto(out *ComponentSpec) {
	*out = *in
	if in.Env != nil {
		in, out := &in.Env, &out.Env
		*out = make([]EnvVar, len(*in))
		copy(*out, *in)
	}
	if in.Replicas != nil {
		in, out := &in.Replicas, &out.Replicas
		*out = new(int32)
		**out = **in
	}
	if in.NodeSelectorLabels != nil {
		in, out := &in.NodeSelectorLabels, &out.NodeSelectorLabels
		*out = make(map[string]string, len(*in))
		for key, val := range *in {
			(*out)[key] = val
		}
	}
	if in.StartAfterComponents != nil {
		in, out := &in.StartAfterComponents, &out.StartAfterComponents
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
	if in.Command != nil {
		in, out := &in.Command, &out.Command
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
	if in.Args != nil {
		in, out := &in.Args, &out.Args
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
	if in.Ports != nil {
		in, out := &in.Ports, &out.Ports
		*out = make([]Port, len(*in))
		copy(*out, *in)
	}
	if in.LivenessProbe != nil {
		in, out := &in.LivenessProbe, &out.LivenessProbe
		*out = new(v1.Probe)
		(*in).DeepCopyInto(*out)
	}
	if in.ReadinessProbe != nil {
		in, out := &in.ReadinessProbe, &out.ReadinessProbe
		*out = new(v1.Probe)
		(*in).DeepCopyInto(*out)
	}
	if in.BeforeStart != nil {
		in, out := &in.BeforeStart, &out.BeforeStart
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
	if in.AfterStart != nil {
		in, out := &in.AfterStart, &out.AfterStart
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
	if in.BeforeDestroy != nil {
		in, out := &in.BeforeDestroy, &out.BeforeDestroy
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
	if in.CPU != nil {
		in, out := &in.CPU, &out.CPU
		x := (*in).DeepCopy()
		*out = &x
	}
	if in.Memory != nil {
		in, out := &in.Memory, &out.Memory
		x := (*in).DeepCopy()
		*out = &x
	}
	if in.TerminationGracePeriodSeconds != nil {
		in, out := &in.TerminationGracePeriodSeconds, &out.TerminationGracePeriodSeconds
		*out = new(int64)
		**out = **in
	}
	if in.Configs != nil {
		in, out := &in.Configs, &out.Configs
		*out = make([]Config, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
	if in.DirectConfigs != nil {
		in, out := &in.DirectConfigs, &out.DirectConfigs
		*out = make([]DirectConfig, len(*in))
		copy(*out, *in)
	}
	if in.Volumes != nil {
		in, out := &in.Volumes, &out.Volumes
		*out = make([]Volume, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
	if in.RunnerPermission != nil {
		in, out := &in.RunnerPermission, &out.RunnerPermission
		*out = new(RunnerPermission)
		(*in).DeepCopyInto(*out)
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ComponentSpec.
func (in *ComponentSpec) DeepCopy() *ComponentSpec {
	if in == nil {
		return nil
	}
	out := new(ComponentSpec)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ComponentStatus) DeepCopyInto(out *ComponentStatus) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ComponentStatus.
func (in *ComponentStatus) DeepCopy() *ComponentStatus {
	if in == nil {
		return nil
	}
	out := new(ComponentStatus)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ComponentTemplate) DeepCopyInto(out *ComponentTemplate) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ObjectMeta.DeepCopyInto(&out.ObjectMeta)
	in.Spec.DeepCopyInto(&out.Spec)
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ComponentTemplate.
func (in *ComponentTemplate) DeepCopy() *ComponentTemplate {
	if in == nil {
		return nil
	}
	out := new(ComponentTemplate)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *ComponentTemplate) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ComponentTemplateList) DeepCopyInto(out *ComponentTemplateList) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ListMeta.DeepCopyInto(&out.ListMeta)
	if in.Items != nil {
		in, out := &in.Items, &out.Items
		*out = make([]ComponentTemplate, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ComponentTemplateList.
func (in *ComponentTemplateList) DeepCopy() *ComponentTemplateList {
	if in == nil {
		return nil
	}
	out := new(ComponentTemplateList)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *ComponentTemplateList) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ComponentTemplateSpec) DeepCopyInto(out *ComponentTemplateSpec) {
	*out = *in
	if in.Env != nil {
		in, out := &in.Env, &out.Env
		*out = make([]EnvVar, len(*in))
		copy(*out, *in)
	}
	if in.Command != nil {
		in, out := &in.Command, &out.Command
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
	if in.Args != nil {
		in, out := &in.Args, &out.Args
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
	if in.Ports != nil {
		in, out := &in.Ports, &out.Ports
		*out = make([]Port, len(*in))
		copy(*out, *in)
	}
	if in.BeforeStart != nil {
		in, out := &in.BeforeStart, &out.BeforeStart
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
	if in.AfterStart != nil {
		in, out := &in.AfterStart, &out.AfterStart
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
	if in.BeforeDestroy != nil {
		in, out := &in.BeforeDestroy, &out.BeforeDestroy
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
	out.CPU = in.CPU.DeepCopy()
	out.Memory = in.Memory.DeepCopy()
	if in.VolumeMounts != nil {
		in, out := &in.VolumeMounts, &out.VolumeMounts
		*out = make([]v1.VolumeMount, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ComponentTemplateSpec.
func (in *ComponentTemplateSpec) DeepCopy() *ComponentTemplateSpec {
	if in == nil {
		return nil
	}
	out := new(ComponentTemplateSpec)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *Config) DeepCopyInto(out *Config) {
	*out = *in
	if in.Paths != nil {
		in, out := &in.Paths, &out.Paths
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new Config.
func (in *Config) DeepCopy() *Config {
	if in == nil {
		return nil
	}
	out := new(Config)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *DirectConfig) DeepCopyInto(out *DirectConfig) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new DirectConfig.
func (in *DirectConfig) DeepCopy() *DirectConfig {
	if in == nil {
		return nil
	}
	out := new(DirectConfig)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *DockerRegistry) DeepCopyInto(out *DockerRegistry) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ObjectMeta.DeepCopyInto(&out.ObjectMeta)
	in.Spec.DeepCopyInto(&out.Spec)
	in.Status.DeepCopyInto(&out.Status)
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new DockerRegistry.
func (in *DockerRegistry) DeepCopy() *DockerRegistry {
	if in == nil {
		return nil
	}
	out := new(DockerRegistry)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *DockerRegistry) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *DockerRegistryList) DeepCopyInto(out *DockerRegistryList) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ListMeta.DeepCopyInto(&out.ListMeta)
	if in.Items != nil {
		in, out := &in.Items, &out.Items
		*out = make([]DockerRegistry, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new DockerRegistryList.
func (in *DockerRegistryList) DeepCopy() *DockerRegistryList {
	if in == nil {
		return nil
	}
	out := new(DockerRegistryList)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *DockerRegistryList) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *DockerRegistrySpec) DeepCopyInto(out *DockerRegistrySpec) {
	*out = *in
	if in.PoolingIntervalSeconds != nil {
		in, out := &in.PoolingIntervalSeconds, &out.PoolingIntervalSeconds
		*out = new(int)
		**out = **in
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new DockerRegistrySpec.
func (in *DockerRegistrySpec) DeepCopy() *DockerRegistrySpec {
	if in == nil {
		return nil
	}
	out := new(DockerRegistrySpec)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *DockerRegistryStatus) DeepCopyInto(out *DockerRegistryStatus) {
	*out = *in
	if in.Repositories != nil {
		in, out := &in.Repositories, &out.Repositories
		*out = make([]*Repository, len(*in))
		for i := range *in {
			if (*in)[i] != nil {
				in, out := &(*in)[i], &(*out)[i]
				*out = new(Repository)
				(*in).DeepCopyInto(*out)
			}
		}
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new DockerRegistryStatus.
func (in *DockerRegistryStatus) DeepCopy() *DockerRegistryStatus {
	if in == nil {
		return nil
	}
	out := new(DockerRegistryStatus)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *EnvVar) DeepCopyInto(out *EnvVar) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new EnvVar.
func (in *EnvVar) DeepCopy() *EnvVar {
	if in == nil {
		return nil
	}
	out := new(EnvVar)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *HttpRoute) DeepCopyInto(out *HttpRoute) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ObjectMeta.DeepCopyInto(&out.ObjectMeta)
	in.Spec.DeepCopyInto(&out.Spec)
	in.Status.DeepCopyInto(&out.Status)
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HttpRoute.
func (in *HttpRoute) DeepCopy() *HttpRoute {
	if in == nil {
		return nil
	}
	out := new(HttpRoute)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *HttpRoute) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *HttpRouteCORS) DeepCopyInto(out *HttpRouteCORS) {
	*out = *in
	if in.AllowOrigins != nil {
		in, out := &in.AllowOrigins, &out.AllowOrigins
		*out = make([]HttpRouteCondition, len(*in))
		copy(*out, *in)
	}
	if in.AllowMethods != nil {
		in, out := &in.AllowMethods, &out.AllowMethods
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
	if in.AllowHeaders != nil {
		in, out := &in.AllowHeaders, &out.AllowHeaders
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HttpRouteCORS.
func (in *HttpRouteCORS) DeepCopy() *HttpRouteCORS {
	if in == nil {
		return nil
	}
	out := new(HttpRouteCORS)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *HttpRouteCondition) DeepCopyInto(out *HttpRouteCondition) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HttpRouteCondition.
func (in *HttpRouteCondition) DeepCopy() *HttpRouteCondition {
	if in == nil {
		return nil
	}
	out := new(HttpRouteCondition)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *HttpRouteDelay) DeepCopyInto(out *HttpRouteDelay) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HttpRouteDelay.
func (in *HttpRouteDelay) DeepCopy() *HttpRouteDelay {
	if in == nil {
		return nil
	}
	out := new(HttpRouteDelay)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *HttpRouteDestination) DeepCopyInto(out *HttpRouteDestination) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HttpRouteDestination.
func (in *HttpRouteDestination) DeepCopy() *HttpRouteDestination {
	if in == nil {
		return nil
	}
	out := new(HttpRouteDestination)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *HttpRouteFault) DeepCopyInto(out *HttpRouteFault) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HttpRouteFault.
func (in *HttpRouteFault) DeepCopy() *HttpRouteFault {
	if in == nil {
		return nil
	}
	out := new(HttpRouteFault)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *HttpRouteList) DeepCopyInto(out *HttpRouteList) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ListMeta.DeepCopyInto(&out.ListMeta)
	if in.Items != nil {
		in, out := &in.Items, &out.Items
		*out = make([]HttpRoute, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HttpRouteList.
func (in *HttpRouteList) DeepCopy() *HttpRouteList {
	if in == nil {
		return nil
	}
	out := new(HttpRouteList)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *HttpRouteList) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *HttpRouteMirror) DeepCopyInto(out *HttpRouteMirror) {
	*out = *in
	out.Destination = in.Destination
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HttpRouteMirror.
func (in *HttpRouteMirror) DeepCopy() *HttpRouteMirror {
	if in == nil {
		return nil
	}
	out := new(HttpRouteMirror)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *HttpRouteRetries) DeepCopyInto(out *HttpRouteRetries) {
	*out = *in
	if in.RetryOn != nil {
		in, out := &in.RetryOn, &out.RetryOn
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HttpRouteRetries.
func (in *HttpRouteRetries) DeepCopy() *HttpRouteRetries {
	if in == nil {
		return nil
	}
	out := new(HttpRouteRetries)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in HttpRouteSchemes) DeepCopyInto(out *HttpRouteSchemes) {
	{
		in := &in
		*out = make(HttpRouteSchemes, len(*in))
		copy(*out, *in)
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HttpRouteSchemes.
func (in HttpRouteSchemes) DeepCopy() HttpRouteSchemes {
	if in == nil {
		return nil
	}
	out := new(HttpRouteSchemes)
	in.DeepCopyInto(out)
	return *out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *HttpRouteSpec) DeepCopyInto(out *HttpRouteSpec) {
	*out = *in
	if in.Hosts != nil {
		in, out := &in.Hosts, &out.Hosts
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
	if in.Paths != nil {
		in, out := &in.Paths, &out.Paths
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
	if in.Methods != nil {
		in, out := &in.Methods, &out.Methods
		*out = make([]HttpRouteMethod, len(*in))
		copy(*out, *in)
	}
	if in.Schemes != nil {
		in, out := &in.Schemes, &out.Schemes
		*out = make(HttpRouteSchemes, len(*in))
		copy(*out, *in)
	}
	if in.Conditions != nil {
		in, out := &in.Conditions, &out.Conditions
		*out = make([]HttpRouteCondition, len(*in))
		copy(*out, *in)
	}
	if in.Destinations != nil {
		in, out := &in.Destinations, &out.Destinations
		*out = make([]HttpRouteDestination, len(*in))
		copy(*out, *in)
	}
	if in.Timeout != nil {
		in, out := &in.Timeout, &out.Timeout
		*out = new(int)
		**out = **in
	}
	if in.Retries != nil {
		in, out := &in.Retries, &out.Retries
		*out = new(HttpRouteRetries)
		(*in).DeepCopyInto(*out)
	}
	if in.Mirror != nil {
		in, out := &in.Mirror, &out.Mirror
		*out = new(HttpRouteMirror)
		**out = **in
	}
	if in.Fault != nil {
		in, out := &in.Fault, &out.Fault
		*out = new(HttpRouteFault)
		**out = **in
	}
	if in.Delay != nil {
		in, out := &in.Delay, &out.Delay
		*out = new(HttpRouteDelay)
		**out = **in
	}
	if in.CORS != nil {
		in, out := &in.CORS, &out.CORS
		*out = new(HttpRouteCORS)
		(*in).DeepCopyInto(*out)
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HttpRouteSpec.
func (in *HttpRouteSpec) DeepCopy() *HttpRouteSpec {
	if in == nil {
		return nil
	}
	out := new(HttpRouteSpec)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *HttpRouteStatus) DeepCopyInto(out *HttpRouteStatus) {
	*out = *in
	if in.HostCertifications != nil {
		in, out := &in.HostCertifications, &out.HostCertifications
		*out = make(map[string]string, len(*in))
		for key, val := range *in {
			(*out)[key] = val
		}
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HttpRouteStatus.
func (in *HttpRouteStatus) DeepCopy() *HttpRouteStatus {
	if in == nil {
		return nil
	}
	out := new(HttpRouteStatus)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *HttpsCert) DeepCopyInto(out *HttpsCert) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ObjectMeta.DeepCopyInto(&out.ObjectMeta)
	in.Spec.DeepCopyInto(&out.Spec)
	out.Status = in.Status
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HttpsCert.
func (in *HttpsCert) DeepCopy() *HttpsCert {
	if in == nil {
		return nil
	}
	out := new(HttpsCert)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *HttpsCert) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *HttpsCertIssuer) DeepCopyInto(out *HttpsCertIssuer) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ObjectMeta.DeepCopyInto(&out.ObjectMeta)
	in.Spec.DeepCopyInto(&out.Spec)
	out.Status = in.Status
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HttpsCertIssuer.
func (in *HttpsCertIssuer) DeepCopy() *HttpsCertIssuer {
	if in == nil {
		return nil
	}
	out := new(HttpsCertIssuer)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *HttpsCertIssuer) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *HttpsCertIssuerList) DeepCopyInto(out *HttpsCertIssuerList) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ListMeta.DeepCopyInto(&out.ListMeta)
	if in.Items != nil {
		in, out := &in.Items, &out.Items
		*out = make([]HttpsCertIssuer, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HttpsCertIssuerList.
func (in *HttpsCertIssuerList) DeepCopy() *HttpsCertIssuerList {
	if in == nil {
		return nil
	}
	out := new(HttpsCertIssuerList)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *HttpsCertIssuerList) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *HttpsCertIssuerSpec) DeepCopyInto(out *HttpsCertIssuerSpec) {
	*out = *in
	if in.CAForTest != nil {
		in, out := &in.CAForTest, &out.CAForTest
		*out = new(CAForTestIssuer)
		**out = **in
	}
	if in.ACMECloudFlare != nil {
		in, out := &in.ACMECloudFlare, &out.ACMECloudFlare
		*out = new(ACMECloudFlareIssuer)
		**out = **in
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HttpsCertIssuerSpec.
func (in *HttpsCertIssuerSpec) DeepCopy() *HttpsCertIssuerSpec {
	if in == nil {
		return nil
	}
	out := new(HttpsCertIssuerSpec)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *HttpsCertIssuerStatus) DeepCopyInto(out *HttpsCertIssuerStatus) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HttpsCertIssuerStatus.
func (in *HttpsCertIssuerStatus) DeepCopy() *HttpsCertIssuerStatus {
	if in == nil {
		return nil
	}
	out := new(HttpsCertIssuerStatus)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *HttpsCertList) DeepCopyInto(out *HttpsCertList) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ListMeta.DeepCopyInto(&out.ListMeta)
	if in.Items != nil {
		in, out := &in.Items, &out.Items
		*out = make([]HttpsCert, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HttpsCertList.
func (in *HttpsCertList) DeepCopy() *HttpsCertList {
	if in == nil {
		return nil
	}
	out := new(HttpsCertList)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *HttpsCertList) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *HttpsCertSpec) DeepCopyInto(out *HttpsCertSpec) {
	*out = *in
	if in.Domains != nil {
		in, out := &in.Domains, &out.Domains
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HttpsCertSpec.
func (in *HttpsCertSpec) DeepCopy() *HttpsCertSpec {
	if in == nil {
		return nil
	}
	out := new(HttpsCertSpec)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *HttpsCertStatus) DeepCopyInto(out *HttpsCertStatus) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HttpsCertStatus.
func (in *HttpsCertStatus) DeepCopy() *HttpsCertStatus {
	if in == nil {
		return nil
	}
	out := new(HttpsCertStatus)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *KappValidateError) DeepCopyInto(out *KappValidateError) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new KappValidateError.
func (in *KappValidateError) DeepCopy() *KappValidateError {
	if in == nil {
		return nil
	}
	out := new(KappValidateError)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in KappValidateErrorList) DeepCopyInto(out *KappValidateErrorList) {
	{
		in := &in
		*out = make(KappValidateErrorList, len(*in))
		copy(*out, *in)
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new KappValidateErrorList.
func (in KappValidateErrorList) DeepCopy() KappValidateErrorList {
	if in == nil {
		return nil
	}
	out := new(KappValidateErrorList)
	in.DeepCopyInto(out)
	return *out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *PluginIngress) DeepCopyInto(out *PluginIngress) {
	*out = *in
	if in.Hosts != nil {
		in, out := &in.Hosts, &out.Hosts
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new PluginIngress.
func (in *PluginIngress) DeepCopy() *PluginIngress {
	if in == nil {
		return nil
	}
	out := new(PluginIngress)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *PluginManualScaler) DeepCopyInto(out *PluginManualScaler) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new PluginManualScaler.
func (in *PluginManualScaler) DeepCopy() *PluginManualScaler {
	if in == nil {
		return nil
	}
	out := new(PluginManualScaler)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *Port) DeepCopyInto(out *Port) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new Port.
func (in *Port) DeepCopy() *Port {
	if in == nil {
		return nil
	}
	out := new(Port)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *Repository) DeepCopyInto(out *Repository) {
	*out = *in
	if in.Tags != nil {
		in, out := &in.Tags, &out.Tags
		*out = make([]RepositoryTag, len(*in))
		copy(*out, *in)
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new Repository.
func (in *Repository) DeepCopy() *Repository {
	if in == nil {
		return nil
	}
	out := new(Repository)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *RepositoryTag) DeepCopyInto(out *RepositoryTag) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new RepositoryTag.
func (in *RepositoryTag) DeepCopy() *RepositoryTag {
	if in == nil {
		return nil
	}
	out := new(RepositoryTag)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *RunnerPermission) DeepCopyInto(out *RunnerPermission) {
	*out = *in
	if in.Rules != nil {
		in, out := &in.Rules, &out.Rules
		*out = make([]v1beta1.PolicyRule, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new RunnerPermission.
func (in *RunnerPermission) DeepCopy() *RunnerPermission {
	if in == nil {
		return nil
	}
	out := new(RunnerPermission)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *Volume) DeepCopyInto(out *Volume) {
	*out = *in
	out.Size = in.Size.DeepCopy()
	if in.StorageClassName != nil {
		in, out := &in.StorageClassName, &out.StorageClassName
		*out = new(string)
		**out = **in
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new Volume.
func (in *Volume) DeepCopy() *Volume {
	if in == nil {
		return nil
	}
	out := new(Volume)
	in.DeepCopyInto(out)
	return out
}
