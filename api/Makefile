auth_proxy:
	KALM_OIDC_CLIENT_ID=$(shell kubectl get secrets -n kalm-system dex-secret --template={{.data.client_id}} | base64 -D) \
KALM_OIDC_CLIENT_SECRET=$(shell kubectl get secrets -n kalm-system dex-secret --template={{.data.client_secret}} | base64 -D) \
KALM_OIDC_PROVIDER_URL="$(shell kubectl get httproutes.core.kalm.dev -n kalm-system dex -o jsonpath='http://{.spec.hosts[0]}'):$(shell kubectl get svc -n istio-system istio-ingressgateway -o jsonpath='{.spec.ports[?(@.port==80)].nodePort}')/dex" \
KALM_OIDC_AUTH_PROXY_URL="http://$(shell kubectl get serviceentries.networking.istio.io -n kalm-system external-envoy-ext-authz-server -o jsonpath='{.spec.hosts[0]}'):$(shell kubectl get serviceentries.networking.istio.io -n kalm-system external-envoy-ext-authz-server -o jsonpath='{.spec.ports[0].number}')" \
go run ./cmd/auth-proxy

run:
	go run .
