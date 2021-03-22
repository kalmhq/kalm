#!/bin/bash

# Notes: based on https://stackoverflow.com/a/27332476/404145
#        with small modifications

VERSION=""

#get parameters
while getopts v: flag
do
  case "${flag}" in
    v) VERSION=${OPTARG};;
  esac
done

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

if [[ $VERSION == 'major' ]]
then
  VNUM1=$((VNUM1+1))
elif [[ $VERSION == 'minor' ]]
then
  VNUM2=$((VNUM2+1))
elif [[ $VERSION == 'patch' ]]
then
  VNUM3=$((VNUM3+1))
  VNUM3=$(printf "%03g" $VNUM3)
else
  echo "No version type (https://semver.org/) or incorrect type specified, try: -v [major, minor, patch]"
  exit 1
fi


#create new tag
NEW_TAG="v$VNUM1.$VNUM2.$VNUM3-auto"
#echo "($VERSION) updating $CURRENT_VERSION to $NEW_TAG."

#get current hash and see if it already has a tag
GIT_COMMIT=`git rev-parse HEAD`
NEEDS_TAG=`git describe --contains $GIT_COMMIT 2>/dev/null`

#only tag if no tag already
#to publish, need to be logged in to npm, and with clean working directory: `npm login; git stash`
if [ -z "$NEEDS_TAG" ]; then
  git tag $NEW_TAG
  echo "Tagged with $NEW_TAG"

  git push --tags
  #git push
else
  echo "Already a tag on this commit"
fi

exit 0
