package controllers

import (
	"context"
	"github.com/kapp-staging/kapp/api/v1alpha1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"

	//"crypto/rand"
	//"fmt"
	//"github.com/kapp-staging/kapp/api/v1alpha1"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	//v1 "k8s.io/api/apps/v1"
	//coreV1 "k8s.io/api/core/v1"
	//"k8s.io/apimachinery/pkg/api/resource"
	//metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	//"k8s.io/apimachinery/pkg/types"
	//"sigs.k8s.io/controller-runtime/pkg/client"
	//"time"
)

func generateEmptyPlugin() *v1alpha1.Plugin {
	name := randomName()[:12]

	application := &v1alpha1.Plugin{
		TypeMeta: metaV1.TypeMeta{
			Kind:       "Plugin",
			APIVersion: "core.kapp.dev/v1alpha1",
		},
		ObjectMeta: metaV1.ObjectMeta{
			Name:      name,
			Namespace: TestNameSpaceName,
		},
		Spec: v1alpha1.PluginSpec{
			Src:                   "",
			AvailableWorkloadType: []v1alpha1.WorkloadType{},
		},
	}

	return application
}

func getPluginNamespacedName(app *v1alpha1.Plugin) types.NamespacedName {
	return types.NamespacedName{Name: app.Name, Namespace: app.Namespace}
}

func updatePlugin(plugin *v1alpha1.Plugin) {
	Expect(k8sClient.Update(context.Background(), plugin)).Should(Succeed())
}

func reloadPlugin(plugin *v1alpha1.Plugin) {
	Expect(k8sClient.Get(context.Background(), getPluginNamespacedName(plugin), plugin)).Should(Succeed())
}

func createPlugin(plugin *v1alpha1.Plugin) {
	Expect(k8sClient.Create(context.Background(), plugin)).Should(Succeed())

	// after the finalizer is set, the plugin won't auto change
	Eventually(func() bool {
		err := k8sClient.Get(context.Background(), getPluginNamespacedName(plugin), plugin)

		if err != nil {
			return false
		}

		for i := range plugin.Finalizers {
			if plugin.Finalizers[i] == finalizerName {
				return true
			}
		}
		return false
	}, timeout, interval).Should(Equal(true))
}

var _ = Describe("Plugin basic CRUD", func() {
	defer GinkgoRecover()

	It("Should handle plugin correctly", func() {
		By("Create")
		plugin := generateEmptyPlugin()
		createPlugin(plugin)

		By("Get")
		Eventually(func() error {
			return k8sClient.Get(context.Background(), getPluginNamespacedName(plugin), plugin)
		}, timeout, interval).Should(Succeed())
		Expect(plugin.Status.CompiledSuccessfully).Should(BeFalse())

		By("Update")
		plugin.Spec.Src = "console.log(\"hello world!\");"
		updatePlugin(plugin)
		Eventually(func() bool {
			reloadPlugin(plugin)
			return plugin.Status.CompiledSuccessfully
		}, timeout, interval).Should(BeTrue())

		By("Update to bad src")
		plugin.Spec.Src = "wrong source"
		updatePlugin(plugin)
		Eventually(func() bool {
			reloadPlugin(plugin)
			return plugin.Status.CompiledSuccessfully
		}, timeout, interval).Should(BeFalse())

		By("Delete")
		Eventually(func() error {
			reloadPlugin(plugin)
			return k8sClient.Delete(context.Background(), plugin)
		}, timeout, interval).Should(Succeed())

		By("Read after delete")
		Eventually(func() error {
			f := &v1alpha1.Plugin{}
			return k8sClient.Get(context.Background(), getPluginNamespacedName(plugin), f)
		}, timeout, interval).ShouldNot(Succeed())
	})

})
