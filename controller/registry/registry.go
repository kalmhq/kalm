package registry

import (
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"regexp"
	"strings"
)

const WWW_AUTHENTICATE = "Www-Authenticate"

type Registry struct {
	Host   string `json:"host"`
	Client *http.Client
}

type Transport struct {
	Username string
	Password string
	Next     http.RoundTripper
}

func (t *Transport) RoundTrip(req *http.Request) (res *http.Response, err error) {
	res, err = t.Next.RoundTrip(req)
	if err != nil || res == nil {
		return
	}

	if res.StatusCode == http.StatusUnauthorized {
		authProvider := getAuthProvider(res)

		if authProvider == nil {
			return
		}

		_ = res.Body.Close()
		return t.authThenRetry(req, authProvider)
	}

	return
}

type AuthProvider struct {
	Realm   string
	Service string
	Scope   string
}

func (t *Transport) authThenRetry(req *http.Request, authProvider *AuthProvider) (res *http.Response, err error) {
	authReq, err := t.getAuthRequest(authProvider)
	if err != nil {
		return nil, err
	}

	c := http.Client{Transport: t.Next}
	authRes, err := c.Do(authReq)

	if err != nil {
		return nil, err
	}

	if authRes.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("auth request failed.")
	}

	defer authRes.Body.Close()

	bodyBytes, err := ioutil.ReadAll(authRes.Body)

	if err != nil {
		return nil, err
	}
	var dest struct {
		Token string `json:"token"`
	}

	err = json.Unmarshal(bodyBytes, &dest)

	if err != nil || dest.Token == "" {
		return nil, err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", dest.Token))
	return t.Next.RoundTrip(req)
}

func getAuthProvider(res *http.Response) *AuthProvider {
	headers := res.Header[WWW_AUTHENTICATE]

	for _, authHeader := range headers {
		if !strings.HasPrefix(authHeader, "Bearer ") {
			continue
		}

		content := strings.TrimPrefix(authHeader, "Bearer ")
		parts := strings.Split(content, ",")
		keyValuePairs := map[string]string{}

		for _, part := range parts {
			kvs := strings.Split(part, "=")
			keyValuePairs[kvs[0]] = strings.TrimPrefix(strings.TrimSuffix(kvs[1], "\""), "\"")
		}

		return &AuthProvider{
			Realm:   keyValuePairs["realm"],
			Service: keyValuePairs["service"],
			Scope:   keyValuePairs["scope"],
		}
	}

	return nil
}

func (t *Transport) getAuthRequest(authProvider *AuthProvider) (*http.Request, error) {
	uri, err := url.Parse(authProvider.Realm)

	if err != nil {
		return nil, err
	}

	query := uri.Query()
	if authProvider.Service != "" {
		query.Set("service", authProvider.Service)
	}
	if authProvider.Scope != "" {
		query.Set("scope", authProvider.Scope)
	}
	uri.RawQuery = query.Encode()

	authRequest, err := http.NewRequest("GET", uri.String(), nil)

	if err != nil {
		return nil, err
	}

	if t.Username != "" && t.Password != "" {
		authRequest.SetBasicAuth(t.Username, t.Password)
	}

	return authRequest, nil
}

func NewRegistry(host, username, password string) *Registry {
	client := &http.Client{
		Transport: &Transport{username, password, http.DefaultTransport},
	}

	return &Registry{
		Host:   strings.TrimSuffix(host, "/"),
		Client: client,
	}
}

func (r *Registry) Ping() error {
	resp, err := r.Client.Get(r.Host + "/v2/")

	if resp != nil {
		defer resp.Body.Close()
	}

	return err
}

var nextLinkRE = regexp.MustCompile(`^ *<?([^;>]+)>? *(?:;[^;]*)*; *rel="?next"?(?:;.*)?`)

func getNextLink(resp *http.Response) (string, error) {
	for _, link := range resp.Header[http.CanonicalHeaderKey("Link")] {
		parts := nextLinkRE.FindStringSubmatch(link)
		if parts != nil {
			return parts[1], nil
		}
	}
	return "", io.EOF
}

func (r *Registry) GetResponseAndNextUrl(url string, response interface{}) (string, error) {
	resp, err := r.Client.Get(url)

	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	bodyBytes, err := ioutil.ReadAll(resp.Body)

	if err != nil {
		return "", nil
	}

	err = json.Unmarshal(bodyBytes, response)

	if err != nil {
		return "", err
	}

	return getNextLink(resp)
}

func (r *Registry) Repositories() (repos []string, err error) {
	repos = make([]string, 0, 10)

	var response struct {
		Repositories []string `json:"repositories"`
	}

	url := r.Host + "/v2/_catalog"

	for {
		url, err = r.GetResponseAndNextUrl(url, &response)
		switch err {
		case io.EOF:
			repos = append(repos, response.Repositories...)
			return repos, nil
		case nil:
			repos = append(repos, response.Repositories...)
			continue
		default:
			return nil, err
		}
	}
}

func (r *Registry) Tags(repository string) (tags []string, err error) {
	url := fmt.Sprintf("%s/v2/%s/tags/list", r.Host, repository)

	var response struct {
		Tags []string `json:"tags"`
	}

	for {
		url, err = r.GetResponseAndNextUrl(url, &response)
		switch err {
		case io.EOF:
			tags = append(tags, response.Tags...)
			return tags, nil
		case nil:
			tags = append(tags, response.Tags...)
			continue
		default:
			return nil, err
		}
	}
}

func (r *Registry) Manifests(repository, reference string) (tags []string, err error) {
	url := fmt.Sprintf("%s/v2/%s/tags/list", r.Host, repository)

	var response struct {
		Tags []string `json:"tags"`
	}

	for {
		url, err = r.GetResponseAndNextUrl(url, &response)
		switch err {
		case io.EOF:
			tags = append(tags, response.Tags...)
			return tags, nil
		case nil:
			tags = append(tags, response.Tags...)
			continue
		default:
			return nil, err
		}
	}
}
