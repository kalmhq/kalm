
DASHBOARD_DOMAIN=$1

if [ -z "$DASHBOARD_DOMAIN" ]
then
      echo "Run like: ./script/configure-local-mode.sh <domain-for-dashboard>"
      echo ""
      echo "must provide domain info for kalm dashboard"
      echo ""
      exit 0
fi

CLUSTER_IP=$(kubectl get svc -nistio-system istio-ingressgateway -ojsonpath={.status.loadBalancer.ingress[0].ip})
CLUSTER_HOSTNAME=$(kubectl get svc -nistio-system istio-ingressgateway -ojsonpath={.status.loadBalancer.ingress[0].hostname})

echo ""
echo "NOTE: DNS Record should be configured to make external access work"
echo ""

if [ -z $CLUSTER_IP ] && [ -z $CLUSTER_HOSTNAME ] 
then
    echo "seems your cluster external access is not ready"
    echo "neither ingress.ip nor ingress.hostname shows up for dashboard service"
    echo "will apply the configure anyway"
    echo ""
elif [ ! -z $CLUSTER_IP ] 
then
    echo "make sure DNS record exist:" 
    echo "  A $DASHBOARD_DOMAIN $CLUSTER_IP"
    echo ""
else
    echo "make sure DNS record exist:"
    echo "  CNAME $DASHBOARD_DOMAIN $CLUSTER_HOSTNAME"
    echo ""
fi

UUID=$(LC_ALL=C; cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 32 | head -n 1)
#echo $UUID

TMP_ADMIN_EMAIL=admin-${UUID}@${DASHBOARD_DOMAIN}
USER_ID=$UUID

CUR_DIR=$(dirname -- "$0")

# update template config yaml
cat $CUR_DIR/template-local-setup.yaml | sed -E "s/DASHBOARD_DOMAIN_PLACEHOLDER/${DASHBOARD_DOMAIN}/g" | sed -E "s/TMP_ADMIN_EMAIL_PLACEHOLDER/${TMP_ADMIN_EMAIL}/g" | sed -E "s/USER_ID_PLACEHOLDER/${USER_ID}/g" | kubectl apply -f -

echo ""
echo "Kalm Configured! 🎉"
echo ""
echo "Visit $DASHBOARD_DOMAIN in your browser"
echo ""
echo "Login using:"
echo ""
echo "  email: $TMP_ADMIN_EMAIL"
echo "  password: password"
echo ""
