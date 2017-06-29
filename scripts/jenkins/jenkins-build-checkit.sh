#!/bin/bash

# Builds the CheckIT project on a Jenkins server
# Build steps in this script are specific to building on Jenkins

# Stores the current date in BUILD_DATE
BUILD_DATE=$(date +%Y%m%d)
# Writes the build date and number to a text file
echo $BUILD_DATE-$BUILD_NUMBER > BUILD_ID.txt

# Disables logging to the console
set +x
# Runs the inject-private-info.sh script to add credentials to files
. ./scripts/inject-private-info.sh
# Enables logging to the console
set -x

# Installs npm and bower dependencies
./scripts/clean-and-install-dependencies.sh

# Builds the CheckIT project
cd $WORKSPACE/client
gulp build-spa
cd ..

# Changes into the absolute path of the directory assigned to the build as a workspace in Jenkins
cd $WORKSPACE
# Zip the contents of the checkit directory
zip -r -qq $JOB_NAME-chkit_app-$BUILD_NUMBER.zip .
