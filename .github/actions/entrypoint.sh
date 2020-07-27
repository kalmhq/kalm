#!/bin/sh -l

resp_code=$(curl -s -o resp.log -w "%{http_code}" -XPOST ${KALM_API_ADDRESS}/__kalm_webhook/deploy?deploy-key=${KALM_DEPLOY_KEY}\&app=${KALM_APP}\&component=${KALM_COMPONENT}\&image-tag=${KALM_COMPONENT_IMG_TAG})

if [ $resp_code == 200 ] 
then
    exit 0
else
    cat resp.log
    exit 1
fi

#echo "::set-output name=time::$time"