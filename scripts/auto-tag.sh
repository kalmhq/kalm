#!/bin/bash

# Notes: based on https://stackoverflow.com/a/27332476/404145
#        with small modifications

#get highest tag number, and add default if doesn't exist
CURRENT_VERSION=`git describe --abbrev=0 --tags 2>&1`
#echo $CURRENT_VERSION

if [[ $CURRENT_VERSION == '' ]]
then
  CURRENT_VERSION='v0.0.1'
fi
echo "Current Version: $CURRENT_VERSION"


#replace . with space so can split into an array
CURRENT_VERSION_PARTS=(${CURRENT_VERSION//./ })

#get number parts
VNUM1=`echo ${CURRENT_VERSION_PARTS[0]} | sed 's/[^0-9]*//g'`
VNUM2=`echo ${CURRENT_VERSION_PARTS[1]} | sed 's/[^0-9]*//g'`
VNUM3=`echo ${CURRENT_VERSION_PARTS[2]} | sed 's/[^0-9]*//g'`
#echo "nums $VNUM1 $VNUM2 $VNUM3"

IS_AUTO_TAG=0
if [[ $CURRENT_VERSION == *"-pre."*  ]]; then
    IS_AUTO_TAG=1
fi

#get current hash and see if it already has a tag
GIT_COMMIT=`git rev-parse HEAD`
NEEDS_TAG=`git describe --contains $GIT_COMMIT 2>/dev/null`

#only tag if no tag already
#to publish, need to be logged in to npm, and with clean working directory: `npm login; git stash`
if [ -z "$NEEDS_TAG" ]; then
  #create new tag

  if [ $IS_AUTO_TAG -eq 0 ]; then
      VNUM3=$(expr $VNUM3 + 1)
  fi

  NEW_TAG="v$VNUM1.$VNUM2.$VNUM3-pre.$(date +"%Y%m%d%H%M")"
  #echo "($VERSION) updating $CURRENT_VERSION to $NEW_TAG."

  git tag $NEW_TAG
  echo "Tagged with $NEW_TAG"

  git push --tags
  #git push
else
  echo "Already a tag on this commit"
fi

exit 0
