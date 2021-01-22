package controllers

import (
	"context"
	"fmt"

	"github.com/grafana-tools/sdk"
	"k8s.io/apimachinery/pkg/util/rand"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
)

var grafanaLog = logf.Log.WithName("grafana-client")

type IGrafanaClient interface {
	// ExistOrg(org string) (bool, error)
	GetOrCreateOrgIfNotExist(orgName string) (*sdk.Org, error)
	ListOrgs() ([]sdk.Org, error)
	// ExistUser(email string) (bool, error)

	// if user not exist, create, then add
	AddUserToOrg(email string, orgID uint) (bool, error)
	// RemoveUserFromOrg(email string, org string) error
	// CreateDataSourceForOrg(tenant string, org string) error
	// CreateDashboardForOrg(tenant string, org string) error
	CreateDatasourceIfNotExist(orgID uint) error
}

var _ IGrafanaClient = &grafanaClient{}

type grafanaClient struct {
	client *sdk.Client
	ctx    context.Context
}

func NewGrafanaClient() *grafanaClient {
	c := sdk.NewClient(GrafanaAPI, grafanaBasicAuth, sdk.DefaultHTTPClient)
	return &grafanaClient{
		client: c,
		ctx:    context.Background(),
	}
}

//todo make LogSystem cluster CRD, and fix ns to kalm-log
const GrafanaNS = "log"
const GrafanaService = "test-grafana"
const GrafanaServicePort = 3000
const lokiService = "test-loki"

var GrafanaAPI = fmt.Sprintf("http://%s.%s:%d", GrafanaService, GrafanaNS, GrafanaServicePort)

//todo move to secret
const grafanaAdmin = "admin"
const grafanaAdminPwd = "admin"

var grafanaBasicAuth = fmt.Sprintf("%s:%s", grafanaAdmin, grafanaAdminPwd)

var GrafanaAPIBasicAuth = fmt.Sprintf("http://%s:%s@%s.%s:%d", grafanaAdmin, grafanaAdminPwd, GrafanaService, GrafanaNS, GrafanaServicePort)

// https://grafana.com/docs/grafana/latest/http_api/org/#search-all-organizations
func (c *grafanaClient) ListOrgs() ([]sdk.Org, error) {
	grafanaLog.Info("listing org")

	orgs, err := c.client.GetAllOrgs(c.ctx)
	grafanaLog.Info(fmt.Sprintf("# of orgs: %d", len(orgs)))

	if err != nil {
		return nil, err
	}

	return orgs, nil
}

// https://grafana.com/docs/grafana/latest/http_api/org/#create-organization
func (c *grafanaClient) GetOrCreateOrgIfNotExist(orgName string) (*sdk.Org, error) {
	grafanaLog.Info("creating org", "name", orgName)

	// check if exist
	orgs, err := c.client.GetAllOrgs(c.ctx)
	if err != nil {
		return nil, err
	}

	for _, org := range orgs {
		if org.Name == orgName {
			return &org, nil
		}
	}

	// create
	org := sdk.Org{Name: orgName}
	statMsg, err := c.client.CreateOrg(c.ctx, org)
	if err != nil {
		return nil, err
	}

	if statMsg.OrgID == nil {
		return nil, fmt.Errorf("create org failed, org: %s, msg: %+v", orgName, statMsg)
	}

	org.ID = *statMsg.ID
	return &org, nil
}

func (c *grafanaClient) ExistUser(email string) (bool, error) {
	perpage := 100
	page := 1

	users, err := c.client.SearchUsersWithPaging(c.ctx, &email, &perpage, &page)
	if err != nil {
		return false, err
	}

	for _, user := range users.Users {
		if user.Email == email {
			return true, nil
		}
	}

	return false, nil
}

func (c grafanaClient) existUserInOrg(email string, orgID uint) (bool, error) {
	users, err := c.client.GetOrgUsers(c.ctx, orgID)
	if err != nil {
		return false, err
	}

	for _, u := range users {
		if u.Email == email {
			return true, nil
		}
	}

	return false, nil
}

// Create new user:
//   https://grafana.com/docs/grafana/latest/http_api/admin/#global-users
// add existing user to org:
//   https://grafana.com/docs/grafana/latest/http_api/org/#add-user-in-organization
func (c *grafanaClient) AddUserToOrg(email string, orgID uint) (createSuccess bool, err error) {
	grafanaLog.Info("adding user to org", "user", email, "org", orgID)

	exist, err := c.ExistUser(email)
	if err != nil {
		return false, err
	}

	if !exist {
		// create user and add it to org
		user := sdk.User{
			Email:    email,
			OrgID:    orgID,
			Password: rand.String(18), //is this necessary?
		}

		statMsg, err := c.client.CreateUser(c.ctx, user)
		if err != nil {
			return false, err
		}

		return statMsg.ID != nil, nil
	}

	if exist, err := c.existUserInOrg(email, orgID); err != nil {
		return false, err
	} else if exist {
		return false, nil
	}

	// add user to org
	statusMsg, err := c.client.AddOrgUser(c.ctx, sdk.UserRole{LoginOrEmail: email, Role: "Viewer"}, orgID)
	if err != nil {
		return false, err
	}

	grafanaLog.Info("AddOrgUser", "resp", statusMsg)
	return true, nil
}

func (c *grafanaClient) RemoveUserFromOrg(email, org string) error {
	panic("not impled yet")
}

func (c *grafanaClient) CreateDatasourceIfNotExist(orgID uint) error {
	datasourceList, err := c.client.GetAllDatasources(c.ctx)
	if err != nil {
		return err
	}

	for _, source := range datasourceList {
		if source.OrgID != orgID {
			continue
		}

		// exist, do nothing
		return nil
	}

	datasource := sdk.Datasource{
		Name:      "Loki",
		Type:      "loki",
		Access:    "proxy", //?
		IsDefault: true,    //?
		URL:       fmt.Sprintf("http://%s:3100", lokiService),
		OrgID:     orgID,
		JSONData: map[string]interface{}{
			"httpHeaderName1": "X-Scope-OrgID",
		},
		SecureJSONData: map[string]interface{}{
			"httpHeaderValue1": orgID,
		},
	}

	statusMsg, err := c.client.CreateDatasource(c.ctx, datasource)
	if err != nil {
		return err
	}

	if statusMsg.ID == nil {
		return fmt.Errorf("fail to create datasource, resp: %+v", statusMsg)
	}

	return nil
}
