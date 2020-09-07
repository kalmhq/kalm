package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"github.com/kalmhq/kalm/controller/utils/imgconv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gomodules.xyz/jsonpatch/v2"
	"k8s.io/api/admission/v1beta1"
	coreV1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
)

var (
	certFile  string
	keyFile   string
	help      bool
	port      int
	cloudName string
)

func init() {
	flag.StringVar(&certFile, "certfile", "/etc/certs/cert.pem", "cert file path")
	flag.StringVar(&keyFile, "keyfile", "/etc/certs/key.pem", "key file path")
	flag.BoolVar(&help, "h", false, "this help")
	flag.IntVar(&port, "port", 3000, "serve port")
	flag.StringVar(&cloudName, "cloud", "", fmt.Sprintf("cloud name (%s)", imgconv.CloudAzureChina))
}

func main() {
	flag.Parse()

	if help {
		flag.Usage()
		return
	}

	e := getServer()

	if err := e.StartTLS(fmt.Sprintf("0.0.0.0:%d", port), certFile, keyFile); err != nil {
		panic(err)
	}
}

func getServer() *echo.Echo {
	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.Logger())
	e.POST("/", handleWebhook)
	return e
}

func handleWebhook(c echo.Context) (err error) {
	var admissionReview v1beta1.AdmissionReview

	defer func() {
		if err != nil {
			var uid types.UID

			if admissionReview.Request != nil {
				uid = admissionReview.Request.UID
			} else {
				uid = ""
			}

			err = c.JSON(200, &v1beta1.AdmissionReview{
				Response: &v1beta1.AdmissionResponse{
					UID:     uid,
					Allowed: false,
					Result: &metaV1.Status{
						Code:    403,
						Message: err.Error(),
					},
				},
			})
		}
	}()

	if err := c.Bind(&admissionReview); err != nil {
		return err
	}

	podBytes := admissionReview.Request.Object.Raw

	var pod coreV1.Pod

	if err := json.Unmarshal(podBytes, &pod); err != nil {
		return err
	}

	podCopy := pod.DeepCopy()

	for i, container := range podCopy.Spec.Containers {
		podCopy.Spec.Containers[i].Image = imgconv.Convert(container.Image, cloudName)
	}

	for i, container := range podCopy.Spec.InitContainers {
		podCopy.Spec.InitContainers[i].Image = imgconv.Convert(container.Image, cloudName)
	}

	patchType := v1beta1.PatchTypeJSONPatch

	operations, err := getJsonpatch(&pod, podCopy)

	if err != nil {
		return err
	}

	patch, _ := json.Marshal(operations)

	res := &v1beta1.AdmissionReview{
		Response: &v1beta1.AdmissionResponse{
			UID:       admissionReview.Request.UID,
			Allowed:   true,
			PatchType: &patchType,
			Patch:     patch,
		},
	}

	return c.JSON(200, res)
}

func getJsonpatch(pod1, pod2 *coreV1.Pod) ([]jsonpatch.Operation, error) {
	bytes1, err := json.Marshal(pod1)

	if err != nil {
		return nil, err
	}

	bytes2, err := json.Marshal(pod2)

	if err != nil {
		return nil, err
	}

	return jsonpatch.CreatePatch(bytes1, bytes2)
}
