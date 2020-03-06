package controllers

import (
	"context"
	"github.com/kapp-staging/kapp/api/v1alpha1"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"time"
)

var _ = Describe("SecretScope Controller", func() {
	const timeout = time.Second * 10
	const interval = time.Second * 1

	key := types.NamespacedName{
		Name:      "kapp-test",
		Namespace: "default",
	}

	BeforeEach(func() {
	})

	AfterEach(func() {
	})

	generateFile := func(path, content string) *v1alpha1.File {
		fileSpec := v1alpha1.FileSpec{
			Path:    path,
			Content: content,
		}

		file := &v1alpha1.File{
			ObjectMeta: metav1.ObjectMeta{
				Name:      key.Name,
				Namespace: key.Namespace,
			},
			Spec: fileSpec,
		}

		return file
	}

	Context("File basic CRUD", func() {
		It("Should handle file correctly", func() {
			file := generateFile("/a/b/c/d.yml", "value")

			By("Creating a file successfully")
			Expect(k8sClient.Create(context.Background(), file)).Should(Succeed())

			By("Ready a file successfully")
			fetched := &v1alpha1.File{}
			Eventually(func() string {
				_ = k8sClient.Get(context.Background(), key, fetched)
				return fetched.Spec.Content
			}, timeout, interval).Should(Equal(file.Spec.Content))

			By("Update a file successfully")
			newFile := generateFile(file.Spec.Path, "new Value")
			newFile.ObjectMeta = fetched.ObjectMeta // metadata.resourceVersion is required in update
			Expect(k8sClient.Update(context.Background(), newFile)).Should(Succeed())
			fetchedUpdated := &v1alpha1.File{}
			Eventually(func() string {
				_ = k8sClient.Get(context.Background(), key, fetchedUpdated)
				return fetchedUpdated.Spec.Content
			}, timeout, interval).Should(Equal(newFile.Spec.Content))

			By("Delete a file successfully")
			Eventually(func() error {
				f := &v1alpha1.File{}
				_ = k8sClient.Get(context.Background(), key, f)
				return k8sClient.Delete(context.Background(), f)
			}, timeout, interval).Should(Succeed())

			Eventually(func() error {
				f := &v1alpha1.File{}
				return k8sClient.Get(context.Background(), key, f)
			}, timeout, interval).ShouldNot(Succeed())
		})
	})

	Context("File related resource CREATE", func() {
		//It("Should handle generated config-map correctly", func() {
		//	file := generateFile("/a/b/c/d.yml", "value")
		//
		//	By("Creating a file & config-map successfully")
		//	Expect(k8sClient.Create(context.Background(), file)).Should(Succeed())
		//
		//	configMapList := &corev1.ConfigMapList{}
		//	Eventually(func() bool {
		//		_ = k8sClient.Get(context.Background(), key, configMapList)
		//
		//		spew.Dump(configMapList)
		//		for i := range configMapList.Items {
		//			configMap := configMapList.Items[i]
		//
		//			if getConfigMapNameFromPath(file.Spec.Path) == configMap.Name {
		//				return true
		//			}
		//		}
		//
		//		return false
		//	}, timeout, interval).Should(Succeed())
		//
		//})
	})
})
