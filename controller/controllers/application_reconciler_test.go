package controllers

import (
	"context"
	"github.com/kapp-staging/kapp/api/v1alpha1"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	v1 "k8s.io/api/apps/v1"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"time"
)

func generateEmptyApplication() *v1alpha1.Application {
	name := randomName()[:12]

	application := &v1alpha1.Application{
		TypeMeta: metaV1.TypeMeta{
			Kind:       "Application",
			APIVersion: "core.kapp.dev/v1alpha1",
		},
		ObjectMeta: metaV1.ObjectMeta{
			Name:      name,
			Namespace: TestNameSpaceName,
		},
		Spec: v1alpha1.ApplicationSpec{
			Components: []v1alpha1.ComponentSpec{},
			SharedEnv:  []v1alpha1.EnvVar{},
		},
	}

	return application
}

func getApplicationNamespacedName(app *v1alpha1.Application) types.NamespacedName {
	return types.NamespacedName{Name: app.Name, Namespace: app.Namespace}
}

func reloadApplication(application *v1alpha1.Application) {
	Expect(k8sClient.Get(context.Background(), getApplicationNamespacedName(application), application)).Should(Succeed())
}

func updateApplication(application *v1alpha1.Application) {
	Expect(k8sClient.Update(context.Background(), application)).Should(Succeed())
}

func createApplication(application *v1alpha1.Application) {
	Expect(k8sClient.Create(context.Background(), application)).Should(Succeed())

	// after the finalizer is set, the application won't auto change
	Eventually(func() bool {
		err := k8sClient.Get(context.Background(), getApplicationNamespacedName(application), application)

		if err != nil {
			return false
		}

		for i := range application.Finalizers {
			if application.Finalizers[i] == finalizerName {
				return true
			}
		}
		return false
	}, timeout, interval).Should(Equal(true))
}

func deleteApplication(application *v1alpha1.Application) {
	Expect(k8sClient.Delete(context.Background(), application)).Should(Succeed())
}

func getApplicationDeployments(application *v1alpha1.Application) []v1.Deployment {
	var deploymentList v1.DeploymentList
	_ = k8sClient.List(context.Background(), &deploymentList, client.MatchingLabels{"kapp-application": application.Name})
	return deploymentList.Items
}

func getApplicationServices(application *v1alpha1.Application) []coreV1.Service {
	var serviceList coreV1.ServiceList
	_ = k8sClient.List(context.Background(), &serviceList, client.MatchingLabels{"kapp-application": application.Name})
	return serviceList.Items
}

func getApplicationPVCs(application *v1alpha1.Application) []coreV1.PersistentVolumeClaim {
	var pvcList coreV1.PersistentVolumeClaimList
	_ = k8sClient.List(context.Background(), &pvcList, client.MatchingLabels{"kapp-application": application.Name})
	return pvcList.Items
}

const timeout = time.Second * 20
const interval = time.Millisecond * 500

var _ = Describe("Application basic CRUD", func() {
	defer GinkgoRecover()

	It("Should handle application correctly", func() {
		By("Create")
		application := generateEmptyApplication()
		createApplication(application)

		By("Ready")
		fetched := &v1alpha1.Application{}
		Eventually(func() error {
			return k8sClient.Get(context.Background(), getApplicationNamespacedName(application), fetched)
		}, timeout, interval).Should(Succeed())

		By("Update")
		fetched.Spec.SharedEnv = append(fetched.Spec.SharedEnv, v1alpha1.EnvVar{
			Name:  "name",
			Value: "value",
			Type:  v1alpha1.EnvVarTypeStatic,
		})

		updateApplication(fetched)
		fetchedUpdated := &v1alpha1.Application{}
		Eventually(func() bool {
			_ = k8sClient.Get(context.Background(), getApplicationNamespacedName(application), fetchedUpdated)
			return len(fetchedUpdated.Spec.SharedEnv) == 1 && fetchedUpdated.Spec.SharedEnv[0].Value == "value"
		}, timeout, interval).Should(Equal(true))

		By("Delete")
		Eventually(func() error {
			reloadApplication(application)
			return k8sClient.Delete(context.Background(), application)
		}, timeout, interval).Should(Succeed())

		By("Read after delete")
		Eventually(func() error {
			f := &v1alpha1.Application{}
			return k8sClient.Get(context.Background(), getApplicationNamespacedName(application), f)
		}, timeout, interval).ShouldNot(Succeed())
		Eventually(func() bool {
			deployments := getApplicationDeployments(application)
			services := getApplicationServices(application)
			return len(deployments) == 0 && len(services) == 0
		}, timeout, interval).Should(Equal(true))
	})
})

var _ = Describe("Application Envs", func() {
	defer GinkgoRecover()

	// generate an application with a single component
	generateApplication := func() *v1alpha1.Application {
		app := generateEmptyApplication()
		app.Spec.Components = append(app.Spec.Components, v1alpha1.ComponentSpec{
			Name:  "test",
			Image: "nginx:latest",
			Env: []v1alpha1.EnvVar{
				{
					Name:  "foo",
					Value: "bar",
					Type:  v1alpha1.EnvVarTypeStatic,
				},
			},
			Ports: []v1alpha1.Port{
				{
					Name:          "test",
					ContainerPort: 8080,
					ServicePort:   80,
					Protocol:      coreV1.ProtocolTCP,
				},
			},
		})
		return app
	}

	Context("Envs", func() {
		It("Only Static", func() {
			By("Create Application")
			application := generateApplication()
			createApplication(application)

			var deployments []v1.Deployment
			Eventually(func() bool {
				deployments = getApplicationDeployments(application)
				return len(deployments) == 1
			}, timeout, interval).Should(Equal(true))

			deployment := deployments[0]
			Expect(deployment.Name).Should(Equal(getDeploymentName(application.Name, "test")))
			Expect(*deployment.Spec.Replicas).Should(Equal(int32(1)))
			containers := deployment.Spec.Template.Spec.Containers
			Expect(len(containers)).Should(Equal(1))
			Expect(len(containers[0].Env)).Should(Equal(1))
			Expect(containers[0].Env[0].Value).Should(Equal("bar"))

			By("Update Deployment manually should have no effects eventually")
			deployment.Spec.Template.Spec.Containers[0].Env[0].Value = "new-value"
			Expect(k8sClient.Update(context.Background(), &deployment)).Should(Succeed())
			Eventually(func() bool {
				deployments = getApplicationDeployments(application)
				return len(deployments) == 1 &&
					deployments[0].Spec.Template.Spec.Containers[0].Env[0].Value == "bar"
			}, timeout, interval).Should(Equal(true))

			By("Add env")
			reloadApplication(application)
			application.Spec.Components[0].Env = append(application.Spec.Components[0].Env, v1alpha1.EnvVar{
				Name:  "newName",
				Value: "newValue",
				Type:  v1alpha1.EnvVarTypeStatic,
			})
			updateApplication(application)
			Eventually(func() bool {
				deployments = getApplicationDeployments(application)
				if len(deployments) != 1 {
					return false
				}
				mainContainer := deployments[0].Spec.Template.Spec.Containers[0]
				return len(mainContainer.Env) == 2 &&
					mainContainer.Env[1].Value == "newValue"
			}, timeout, interval).Should(Equal(true))

			By("Update env")
			reloadApplication(application)
			application.Spec.Components[0].Env[1].Value = "newValue2"
			updateApplication(application)
			Eventually(func() bool {
				deployments = getApplicationDeployments(application)
				return len(deployments) == 1 &&
					deployments[0].Spec.Template.Spec.Containers[0].Env[1].Value == "newValue2"
			}, timeout, interval).Should(Equal(true))

			By("Delete envs")
			reloadApplication(application)
			application.Spec.Components[0].Env = application.Spec.Components[0].Env[:0]
			updateApplication(application)
			Eventually(func() bool {
				deployments = getApplicationDeployments(application)
				return len(deployments) == 1 &&
					len(deployments[0].Spec.Template.Spec.Containers[0].Env) == 0
			}, timeout, interval).Should(Equal(true))
		})

		It("External Static", func() {
			By("Create Application")
			application := generateApplication()
			application.Spec.Components[0].Env = []v1alpha1.EnvVar{
				{
					Name:  "env1",
					Value: "sharedEnv1",
					Type:  v1alpha1.EnvVarTypeExternal,
				},
			}
			application.Spec.SharedEnv = []v1alpha1.EnvVar{
				{
					Name:  "sharedEnv1",
					Value: "value1",
				},
			}
			Expect(k8sClient.Create(context.Background(), application)).Should(Succeed())

			var deployments []v1.Deployment
			Eventually(func() bool {
				deployments = getApplicationDeployments(application)
				return len(deployments) == 1
			}, timeout, interval).Should(Equal(true))

			deployment := deployments[0]
			Expect(deployment.Name).Should(Equal(getDeploymentName(application.Name, "test")))
			Expect(*deployment.Spec.Replicas).Should(Equal(int32(1)))
			containers := deployment.Spec.Template.Spec.Containers
			Expect(len(containers)).Should(Equal(1))
			Expect(len(containers[0].Env)).Should(Equal(1))
			Expect(containers[0].Env[0].Value).Should(Equal("value1"))

			By("Update SharedEnv value should update deployment env value")
			reloadApplication(application)
			application.Spec.SharedEnv[0].Value = "value1-new"
			updateApplication(application)
			Eventually(func() bool {
				deployments = getApplicationDeployments(application)
				if len(deployments) != 1 {
					return false
				}
				mainContainer := deployments[0].Spec.Template.Spec.Containers[0]
				return len(mainContainer.Env) == 1 &&
					mainContainer.Env[0].Value == "value1-new"
			}, timeout, interval).Should(Equal(true))

			By("non-exist external value will be ignore")
			reloadApplication(application)
			application.Spec.SharedEnv = application.Spec.SharedEnv[:0] // delete all sharedEnvs
			updateApplication(application)
			Eventually(func() bool {
				deployments = getApplicationDeployments(application)
				mainContainer := deployments[0].Spec.Template.Spec.Containers[0]
				return len(mainContainer.Env) == 0
			}, timeout, interval).Should(Equal(true))
		})
	})

	Context("Ports", func() {
		It("should create corresponding services", func() {
			application := generateApplication()
			createApplication(application)
			var services []coreV1.Service
			Eventually(func() bool {
				services = getApplicationServices(application)
				return len(services) == 1
			}, timeout, interval).Should(Equal(true))
			Expect(len(services[0].Spec.Ports)).Should(Equal(1))
			applicationPortConfig := application.Spec.Components[0].Ports[0]
			servicePort := services[0].Spec.Ports[0]
			Expect(servicePort.Protocol).Should(Equal(applicationPortConfig.Protocol))
			Expect(uint32(servicePort.TargetPort.IntValue())).Should(Equal(applicationPortConfig.ContainerPort))
			Expect(uint32(servicePort.Port)).Should(Equal(applicationPortConfig.ServicePort))

			By("Update application port")
			reloadApplication(application)
			application.Spec.Components[0].Ports[0].ContainerPort = 3322
			updateApplication(application)
			Eventually(func() bool {
				services = getApplicationServices(application)
				return len(services) == 1 && services[0].Spec.Ports[0].TargetPort.IntValue() == 3322
			}, timeout, interval).Should(Equal(true))

			By("Delete application port")
			reloadApplication(application)
			application.Spec.Components[0].Ports = application.Spec.Components[0].Ports[:0]
			updateApplication(application)
			Eventually(func() bool {
				services = getApplicationServices(application)
				return len(services) == 0
			}, timeout, interval).Should(Equal(true))
		})
	})

	Context("Disks", func() {
		Context("type pvc", func() {
			It("pvc without storageClass", func() {
				application := generateApplication()
				application.Spec.Components[0].Disks = []v1alpha1.Disk{
					{
						Type: v1alpha1.DiskTypePersistentVolumeClaim,
						Path: "/test/b",
						Size: resource.MustParse("10m"),
					},
				}
				createApplication(application)
				var pvcs []coreV1.PersistentVolumeClaim
				Eventually(func() bool {
					pvcs = getApplicationPVCs(application)
					return len(pvcs) == 1
				}, timeout, interval).Should(Equal(true))

				var deployments []v1.Deployment
				Eventually(func() bool {
					deployments = getApplicationDeployments(application)
					return len(deployments) == 1
				}, timeout, interval).Should(Equal(true))

				mountPath := deployments[0].Spec.Template.Spec.Containers[0].VolumeMounts[0]
				volume := deployments[0].Spec.Template.Spec.Volumes[0]

				Expect(mountPath.Name).Should(Equal(pvcs[0].Name))
				Expect(mountPath.MountPath).Should(Equal("/test/b"))
				Expect(volume.Name).Should(Equal(pvcs[0].Name))
				Expect(volume.PersistentVolumeClaim.ClaimName).Should(Equal(pvcs[0].Name))

				Eventually(func() bool {
					reloadApplication(application)
					return application.Spec.Components[0].Disks[0].PersistentVolumeClaimName == pvcs[0].Name
				}, timeout, interval).Should(Equal(true))
			})
		})

		It("temporary disk volume", func() {
			application := generateApplication()
			application.Spec.Components[0].Disks = []v1alpha1.Disk{
				{
					Type: v1alpha1.DiskTypeTemporaryDisk,
					Path: "/test/b",
					Size: resource.MustParse("10m"),
				},
			}
			createApplication(application)

			// will has a deployment
			var deployments []v1.Deployment
			Eventually(func() bool {
				deployments = getApplicationDeployments(application)
				return len(deployments) == 1
			}, timeout, interval).Should(Equal(true))

			mountPath := deployments[0].Spec.Template.Spec.Containers[0].VolumeMounts[0]
			volume := deployments[0].Spec.Template.Spec.Volumes[0]
			Expect(mountPath.MountPath).Should(Equal("/test/b"))
			Expect(volume.EmptyDir.Medium).Should(Equal(coreV1.StorageMediumDefault))

			// won't create pvc
			Eventually(func() bool {
				pvcs := getApplicationPVCs(application)
				return len(pvcs) == 0
			}, 2*time.Second, interval).Should(Equal(true))
		})

		It("temporary memory volume", func() {
			application := generateApplication()
			application.Spec.Components[0].Disks = []v1alpha1.Disk{
				{
					Type: v1alpha1.DiskTypeTemporaryMemory,
					Path: "/test/b",
					Size: resource.MustParse("10m"),
				},
			}
			createApplication(application)

			// will has a deployment
			var deployments []v1.Deployment
			Eventually(func() bool {
				deployments = getApplicationDeployments(application)
				return len(deployments) == 1
			}, timeout, interval).Should(Equal(true))

			mountPath := deployments[0].Spec.Template.Spec.Containers[0].VolumeMounts[0]
			volume := deployments[0].Spec.Template.Spec.Volumes[0]
			Expect(mountPath.MountPath).Should(Equal("/test/b"))
			Expect(volume.EmptyDir.Medium).Should(Equal(coreV1.StorageMediumMemory))

			// won't create pvc
			Eventually(func() bool {
				pvcs := getApplicationPVCs(application)
				return len(pvcs) == 0
			}, 2*time.Second, interval).Should(Equal(true))
		})

		Context("type kapp configs", func() {
			// TODO add a test to mound nested dir
			It("mount config dir", func() {
				file := generateFile("/app/d.yml", "value")
				Expect(k8sClient.Create(context.Background(), file)).Should(Succeed())
				file = generateFile("/app/e.yml", "value2")
				Expect(k8sClient.Create(context.Background(), file)).Should(Succeed())

				// There will have a config-map called config-a-dir
				//   d.yml: value
				//   e.yml: value2

				configMap := &coreV1.ConfigMap{}
				Eventually(func() bool {
					_ = k8sClient.Get(context.Background(), types.NamespacedName{
						Namespace: file.Namespace,
						Name:      getConfigMapNameFromPath(file.Spec.Path),
					}, configMap)
					return len(configMap.Data) == 2
				}, timeout, interval).Should(BeTrue())

				application := generateApplication()
				application.Spec.Components[0].Disks = []v1alpha1.Disk{
					{
						Type:           v1alpha1.DiskTypeKappConfigs,
						Path:           "/test/b",
						Size:           resource.MustParse("10m"),
						KappConfigPath: "/app",
					},
				}
				createApplication(application)

				// will has a deployment
				var deployments []v1.Deployment
				Eventually(func() bool {
					deployments = getApplicationDeployments(application)
					return len(deployments) == 1
				}, timeout, interval).Should(Equal(true))

				mountPath := deployments[0].Spec.Template.Spec.Containers[0].VolumeMounts[0]
				volume := deployments[0].Spec.Template.Spec.Volumes[0]
				Expect(mountPath.MountPath).Should(Equal("/test/b"))
				Expect(mountPath.Name).Should(Equal(volume.Name))
				Expect(volume.ConfigMap.Name).Should(Equal(configMap.Name))
				Expect(len(volume.ConfigMap.Items)).Should(Equal(0))
			})

			It("mount config file", func() {
				file := generateFile("/app.yml", "value")
				Expect(k8sClient.Create(context.Background(), file)).Should(Succeed())

				// There will have a config-map called config--dir
				//   a.yml: value

				configMap := &coreV1.ConfigMap{}
				Eventually(func() bool {
					_ = k8sClient.Get(context.Background(), types.NamespacedName{
						Namespace: file.Namespace,
						Name:      getConfigMapNameFromPath(file.Spec.Path),
					}, configMap)
					return len(configMap.Data) == 1
				}, timeout, interval).Should(BeTrue())

				application := generateApplication()
				application.Spec.Components[0].Disks = []v1alpha1.Disk{
					{
						Type:           v1alpha1.DiskTypeKappConfigs,
						Path:           "/test/b",
						Size:           resource.MustParse("10m"),
						KappConfigPath: "/app.yml",
					},
				}
				createApplication(application)

				// will has a deployment
				var deployments []v1.Deployment
				Eventually(func() bool {
					deployments = getApplicationDeployments(application)
					return len(deployments) == 1
				}, timeout, interval).Should(Equal(true))

				mountPath := deployments[0].Spec.Template.Spec.Containers[0].VolumeMounts[0]
				volume := deployments[0].Spec.Template.Spec.Volumes[0]
				Expect(mountPath.MountPath).Should(Equal("/test/b"))
				Expect(mountPath.Name).Should(Equal(volume.Name))
				Expect(volume.ConfigMap.Name).Should(Equal(configMap.Name))
				Expect(len(volume.ConfigMap.Items)).Should(Equal(1))
				Expect(volume.ConfigMap.Items[0].Path).Should(Equal("app.yml"))
				Expect(volume.ConfigMap.Items[0].Key).Should(Equal("app.yml"))

				By("An application with wrong kapp config path should ignore that mount")
				application = generateApplication()
				application.Spec.Components[0].Disks = []v1alpha1.Disk{
					{
						Type:           v1alpha1.DiskTypeKappConfigs,
						Path:           "/test/b",
						Size:           resource.MustParse("10m"),
						KappConfigPath: "/not-exist.yml",
					},
				}
				createApplication(application)

				// will has a deployment
				Eventually(func() bool {
					deployments = getApplicationDeployments(application)
					return len(deployments) == 1
				}, timeout, interval).Should(Equal(true))

				// but don't have any mounts
				Expect(len(deployments[0].Spec.Template.Spec.Containers[0].VolumeMounts)).Should(Equal(0))
				Expect(len(deployments[0].Spec.Template.Spec.Volumes)).Should(Equal(0))
			})
		})
	})
})
