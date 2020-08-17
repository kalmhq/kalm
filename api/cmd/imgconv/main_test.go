package main

import (
	"bytes"
	"encoding/json"
	"github.com/kalmhq/kalm/controller/utils/imgconv"
	"github.com/labstack/echo/v4"
	"io/ioutil"
	"k8s.io/api/admission/v1beta1"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestWebhookInAzureChina(t *testing.T) {
	e := getServer()
	cloudName = imgconv.CloudAzureChina

	requestBody := `
{
   "kind":"AdmissionReview",
   "apiVersion":"admission.k8s.io/v1beta1",
   "request":{
      "uid":"cb3660c4-b28a-45aa-b0ee-fcc054f27a98",
      "kind":{
         "group":"",
         "version":"v1",
         "kind":"Pod"
      },
      "resource":{
         "group":"",
         "version":"v1",
         "resource":"pods"
      },
      "requestKind":{
         "group":"",
         "version":"v1",
         "kind":"Pod"
      },
      "requestResource":{
         "group":"",
         "version":"v1",
         "resource":"pods"
      },
      "name":"tt",
      "namespace":"kalm-hello-world",
      "operation":"CREATE",
      "userInfo":{
         "username":"minikube-user",
         "groups":[
            "system:masters",
            "system:authenticated"
         ]
      },
      "object":{
         "kind":"Pod",
         "apiVersion":"v1",
         "metadata":{
            "name":"tt",
            "namespace":"kalm-hello-world",
            "creationTimestamp":null
         },
         "spec":{
            "containers":[
               {
                  "name":"tt",
                  "image":"nginx:alpine"
               }
            ]
         }
      },
      "oldObject":null,
      "dryRun":false,
      "options":{
         "kind":"CreateOptions",
         "apiVersion":"meta.k8s.io/v1"
      }
   }
}`

	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(requestBody))
	req.Header.Add(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)

	if rec.Code != 200 {
		t.Fatalf("rec code should be 200")
	}

	bts, err := ioutil.ReadAll(rec.Body)

	if err != nil {
		t.Fatalf("read body error")
	}
	var admissionReview v1beta1.AdmissionReview
	_ = json.Unmarshal(bts, &admissionReview)

	if !admissionReview.Response.Allowed {
		t.Fatalf("should be allowed")
	}

	if admissionReview.Response.Patch == nil {
		t.Fatalf("patch should not be blank")
	}

	expectedPatch := []byte(`[{"op":"replace","path":"/spec/containers/0/image","value":"dockerhub.azk8s.cn/library/nginx:alpine"}]`)
	if !bytes.Equal(admissionReview.Response.Patch, expectedPatch) {
		t.Fatalf("patch results do not match")
	}
}
