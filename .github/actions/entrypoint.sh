#!/bin/sh -l

resp_code=$(curl -s -o resp.log -w "%{http_code}" -XPOST ${INPUT_KALM_API_ADDRESS}/__kalm_webhook/deploy?deploy-key=${INPUT_KALM_DEPLOY_KEY}\&app=${INPUT_KALM_APP}\&component=${INPUT_KALM_COMPONENT}\&image-tag=${INPUT_KALM_COMPONENT_IMG_TAG})

if [ $resp_code == 200 ] 
then
    exit 0
else
    cat resp.log
    exit 1
fi

#echo "::set-output name=time::$time"