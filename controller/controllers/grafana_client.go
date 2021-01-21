package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	logf "sigs.k8s.io/controller-runtime/pkg/log"
)

var grafanaLog = logf.Log.WithName("grafana-client")

type IGrafanaClient interface {
	// ExistOrg(org string) (bool, error)
	CreateOrg(orgName string) (bool, error)
	ListOrgs() ([]grafanaOrg, error)
	AddUserToOrg(email string, org string) (bool, error)
	// RemoveUserFromOrg(email string, org string) error
	// CreateDataSourceForOrg(tenant string, org string) error
	// CreateDashboardForOrg(tenant string, org string) error
}

var _ IGrafanaClient = GrafanaClient{}

type GrafanaClient struct {
}

type grafanaResp struct {
	Message string `json:"message"`
}

type grafanaOrg struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

//todo make LogSystem cluster CRD, and fix ns to kalm-log
const GrafanaNS = "log"
const GrafanaService = "test-grafana"
const GrafanaServicePort = 3000

var GrafanaAPI = fmt.Sprintf("http//%s.%s:%d", GrafanaService, GrafanaNS, GrafanaServicePort)

//todo move to secret
const grafanaAdmin = "admin"
const grafanaAdminPwd = "admin"

var GrafanaAPIBasicAuth = fmt.Sprintf("http//%s:%s@%s.%s:%d", grafanaAdmin, grafanaAdminPwd, GrafanaService, GrafanaNS, GrafanaServicePort)

// func (c GrafanaClient) ExistOrg(org string) (bool, error) {
// 	return false, nil
// }

// https://grafana.com/docs/grafana/latest/http_api/org/#search-all-organizations
func (c GrafanaClient) ListOrgs() ([]grafanaOrg, error) {
	grafanaLog.Info("listing org")

	//todo multi-page
	url := GrafanaAPIBasicAuth + "/api/orgs?perpage=100&page=1"

	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}

	var orgs []grafanaOrg
	payload, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if err := json.Unmarshal(payload, &orgs); err != nil {
		return nil, err
	}

	grafanaLog.Info(fmt.Sprintf("# of orgs: %d", len(orgs)))
	return orgs, nil
}

// https://grafana.com/docs/grafana/latest/http_api/org/#create-organization
func (c GrafanaClient) CreateOrg(org string) (createSuccess bool, err error) {
	grafanaLog.Info("creating org", "name", org)

	url := GrafanaAPIBasicAuth + "/api/orgs"
	body := fmt.Sprintf(`{"name": "%s"}`, org)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer([]byte(body)))
	if err != nil {
		return false, err
	}

	req.Header.Set("Content-Type", "application/json")

	client := http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return false, err
	}

	if resp.StatusCode == 200 {
		createSuccess = true
	} else if resp.StatusCode == 409 {
		//Organization name taken
		createSuccess = false
	} else {
		createSuccess = false

		payload, _ := ioutil.ReadAll(resp.Body)

		resp := grafanaResp{}
		if err := json.Unmarshal(payload, &resp); err != nil {
			return false, err
		}

		err = fmt.Errorf(resp.Message)
	}

	return createSuccess, err
}

// https://grafana.com/docs/grafana/latest/http_api/org/#add-user-in-organization
func (c GrafanaClient) AddUserToOrg(email, org string) (createSuccess bool, err error) {
	grafanaLog.Info("adding user to org", "user", email, "org", org)

	url := GrafanaAPIBasicAuth + fmt.Sprintf("/api/orgs/%s/users", org)
	body := fmt.Sprintf(`{"role": "Viewer", "loginOrEmail": "%s"}`, email)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer([]byte(body)))
	if err != nil {
		return false, err
	}

	req.Header.Set("Content-Type", "application/json")

	client := http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return false, err
	}

	if resp.StatusCode == 200 {
		createSuccess = true
	} else if resp.StatusCode == 409 {
		createSuccess = false
	} else {
		createSuccess = false

		payload, _ := ioutil.ReadAll(resp.Body)

		resp := grafanaResp{}
		if err := json.Unmarshal(payload, &resp); err != nil {
			return false, err
		}

		err = fmt.Errorf(resp.Message)
	}

	return createSuccess, err
}

func (c GrafanaClient) RemoveUserFromOrg(email, org string) error {
	panic("not impled yet")
}
