package controllers

import (
	"context"
	//"github.com/davecgh/go-spew/spew"
	"github.com/kapp-staging/kapp/api/v1alpha1"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"time"
)

var _ = Describe("File Controller", func() {
	defer GinkgoRecover()

	const timeout = time.Second * 10
	const interval = time.Second * 1

	BeforeEach(func() {
	})

	AfterEach(func() {
	})

	reloadFile := func(file *v1alpha1.File) {
		err := k8sClient.Get(context.Background(), types.NamespacedName{Name: file.Name, Namespace: file.Namespace}, file)
		Expect(err).NotTo(HaveOccurred())
	}

	updateFile := func(file *v1alpha1.File) {
		Expect(k8sClient.Update(context.Background(), file)).Should(Succeed())
	}

	deleteFile := func(file *v1alpha1.File) {
		Expect(k8sClient.Delete(context.Background(), file)).Should(Succeed())
	}

	generateFile := func(path, content string) *v1alpha1.File {
		fileSpec := v1alpha1.FileSpec{
			Path:    path,
			Content: content,
		}

		file := &v1alpha1.File{
			ObjectMeta: metav1.ObjectMeta{
				Name:      randomName(),
				Namespace: "default",
			},
			Spec: fileSpec,
		}

		return file

	}

	Context("File basic CRUD", func() {
		It("Should handle file correctly", func() {
			//Skip("skip")
			file := generateFile("/a/b/c/d.yml", "value")

			By("Creating a file successfully")
			Expect(k8sClient.Create(context.Background(), file)).Should(Succeed())

			By("Ready a file successfully")
			fetched := &v1alpha1.File{}
			Eventually(func() string {
				_ = k8sClient.Get(context.Background(), types.NamespacedName{Name: file.Name, Namespace: file.Namespace}, fetched)
				return fetched.Spec.Content
			}, timeout, interval).Should(Equal(file.Spec.Content))

			By("Update a file successfully")
			fetched.Spec.Content = "new value"
			Expect(k8sClient.Update(context.Background(), fetched)).Should(Succeed())
			fetchedUpdated := &v1alpha1.File{}
			Eventually(func() string {
				_ = k8sClient.Get(context.Background(), types.NamespacedName{Name: file.Name, Namespace: file.Namespace}, fetchedUpdated)
				return fetchedUpdated.Spec.Content
			}, timeout, interval).Should(Equal(fetched.Spec.Content))

			By("Delete a file successfully")
			Eventually(func() error {
				f := &v1alpha1.File{}
				_ = k8sClient.Get(context.Background(), types.NamespacedName{Name: file.Name, Namespace: file.Namespace}, f)
				return k8sClient.Delete(context.Background(), f)
			}, timeout, interval).Should(Succeed())

			Eventually(func() error {
				f := &v1alpha1.File{}
				return k8sClient.Get(context.Background(), types.NamespacedName{Name: file.Name, Namespace: file.Namespace}, f)
			}, timeout, interval).ShouldNot(Succeed())
		})
	})

	Context("File related resource CREATE", func() {
		It("Should handle generated config-map correctly", func() {
			//list := &corev1.ConfigMapList{}
			//_ = k8sClient.List(context.Background(), list)
			//spew.Dump(list)

			//Skip("skip")
			file := generateFile("/a/d.yml", "value")

			By("Creating a file & config-map successfully")
			Expect(k8sClient.Create(context.Background(), file)).Should(Succeed())

			expectedFileConfigMapName := "config-a-dir"
			fileConfigMapName := getConfigMapNameFromPath(file.Spec.Path)
			Expect(fileConfigMapName).To(Equal(expectedFileConfigMapName))

			Eventually(func() bool {
				configMap := &corev1.ConfigMap{}
				_ = k8sClient.Get(context.Background(), types.NamespacedName{
					Namespace: file.Namespace,
					Name:      getConfigMapNameFromPath(file.Spec.Path),
				}, configMap)

				return len(configMap.Data) == 1
			}, timeout, interval).Should(BeTrue())

			anotherFile := generateFile("/a/e.yml", "value")
			By("Creating another file in the same dir")
			Expect(k8sClient.Create(context.Background(), anotherFile)).Should(Succeed())

			By("Two file should have in same config-map")
			Expect(getConfigMapNameFromPath(file.Spec.Path)).Should(Equal(getConfigMapNameFromPath(anotherFile.Spec.Path)))

			Eventually(func() bool {
				configMap := &corev1.ConfigMap{}
				_ = k8sClient.Get(context.Background(), types.NamespacedName{
					Namespace: file.Namespace,
					Name:      getConfigMapNameFromPath(file.Spec.Path),
				}, configMap)

				//list := &corev1.ConfigMapList{}
				//_ = k8sClient.List(context.Background(), list)
				//spew.Dump(list)

				return len(configMap.Data) == 2 &&
					configMap.Data[getConfigMapDataKeyFromPath(file.Spec.Path)] == file.Spec.Content &&
					configMap.Data[getConfigMapDataKeyFromPath(anotherFile.Spec.Path)] == anotherFile.Spec.Content
			}, timeout, interval).Should(BeTrue())

			By("Update file content should also change config-map content")
			reloadFile(anotherFile)
			newContent := "new Value"
			anotherFile.Spec.Content = newContent
			updateFile(anotherFile)
			Eventually(func() bool {
				configMap := &corev1.ConfigMap{}

				_ = k8sClient.Get(context.Background(), types.NamespacedName{
					Namespace: file.Namespace,
					Name:      getConfigMapNameFromPath(file.Spec.Path),
				}, configMap)

				return len(configMap.Data) == 2 &&
					configMap.Data[getConfigMapDataKeyFromPath(file.Spec.Path)] == file.Spec.Content &&
					configMap.Data[getConfigMapDataKeyFromPath(anotherFile.Spec.Path)] == newContent
			}, timeout, interval).Should(BeTrue())

			By("Update file path should delete content from old config-map and generate new config-map")
			reloadFile(anotherFile)
			newPath := "/newdir/a.yml"
			anotherFile.Spec.Path = newPath
			updateFile(anotherFile)

			Eventually(func() bool {
				configMap := &corev1.ConfigMap{}

				_ = k8sClient.Get(context.Background(), types.NamespacedName{
					Namespace: file.Namespace,
					Name:      getConfigMapNameFromPath(file.Spec.Path),
				}, configMap)

				//spew.Dump(configMap)

				return len(configMap.Data) == 1 && configMap.Data[getConfigMapDataKeyFromPath(file.Spec.Path)] == file.Spec.Content
			}, timeout, interval).Should(BeTrue())

			expectedAnotherFileConfigMapName := "config-newdir-dir"
			anotherFileConfigMapName := getConfigMapNameFromPath(anotherFile.Spec.Path)
			Expect(anotherFileConfigMapName).To(Equal(expectedAnotherFileConfigMapName))

			Eventually(func() bool {
				configMap := &corev1.ConfigMap{}

				_ = k8sClient.Get(context.Background(), types.NamespacedName{
					Namespace: file.Namespace,
					Name:      getConfigMapNameFromPath(anotherFile.Spec.Path),
				}, configMap)

				return len(configMap.Data) == 1 && configMap.Data[getConfigMapDataKeyFromPath(anotherFile.Spec.Path)] == anotherFile.Spec.Content
			}, timeout, interval).Should(BeTrue())

			By("Delete a file will delete config-map")
			reloadFile(anotherFile)
			deleteFile(anotherFile)
			Eventually(func() error {
				configMap := &corev1.ConfigMap{}

				return k8sClient.Get(context.Background(), types.NamespacedName{
					Namespace: file.Namespace,
					Name:      getConfigMapNameFromPath(anotherFile.Spec.Path),
				}, configMap)

			}, timeout, interval).ShouldNot(Succeed())
		})
	})
})
