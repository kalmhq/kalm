## Create a test user

IMPORTANT: This is for test only! Do not create token this way on a production cluster. Make sure that you know what you are doing before proceeding. Granting admin privileges to Dashboard's Service Account might be a security risk.

To bypass the annoying configuration and restart, in this guide, we will find out how to create a new user using Service Account mechanism of Kubernetes, grant this user admin permissions and login to Kapp Dashboard using bearer token tied to this user.

The commands should be executed in the same shell seesion.

1. Create a service account

```
kubectl create sa kapp-sample-user
```

2. grant admin permission to the service account

```
kubectl create clusterrolebinding kapp-sample-user-admin --user=system:serviceaccount:default:kapp-sample-user --clusterrole=cluster-admin
```

3. Get service account secret name

```
secret=$(kubectl get sa kapp-sample-user -o json | jq -r .secrets\[\].name)
echo $secret
```

You will see some token name like `kapp-sample-user-token-vbhwr`

4. Get secret token

```
secret_token=$(kubectl get secret $secret -o json | jq -r '.data["token"]' | base64 -D)
echo $secret_token
```

5. Use the token you got to login

_IMAGE_PLACEHOLDER_

you will success login.

_IMAGE_PLACEHOLDER_
