#!/bin/bash

echo 'Cleaning and installing dependencies'
./scripts/clean-and-install-dependencies.sh

echo 'Collecting credentials for CheckIT'
echo
WORKSPACE=`pwd`
read -p 'Enter the API host > ' API
read -p 'Enter allowed origins > ' ALLOWED_ORIGINS
read -p 'Enter the Google client ID > ' GOOGLE_CLIENT_ID
read -p 'Enter the Mongo DB host > ' MONGODB_HOST
read -p 'Enter the Mongo DB port > ' MONGODB_PORT
read -p 'Enter the Mongo DB database > ' MONGODB_DB
read -p 'Enter the Mongo DB username > ' MONGODB_USERNAME
read -p 'Enter the Mongo DB password > ' MONGODB_PASSWORD
read -p 'Enter the decryption password > ' DECRYPTION_PASSWORD
read -p 'Enter the Google domain > ' GOOGLE_DOMAIN
read -p 'Enter the service account email > ' SERVICE_ACCOUNT_EMAIL
read -p 'Enter the service account key file path > ' SERVICE_ACCOUNT_KEY_FILE_PATH
read -p 'Enter the app account email > ' APP_ACCOUNT_EMAIL
echo 'Notification method options: disabled (leave blank), hipchat'
read -p 'Enter the notification method (leave blank to disable) > ' NOTIFICATION_METHOD
if [ "$NOTIFICATION_METHOD" = "hipchat" ]
then
    read -p 'Enter the HipChat Room ID > ' HIPCHAT_ROOM_ID
    read -p 'Enter the HipChat Auth Token > ' HIPCHAT_AUTH_TOKEN
fi

echo

echo 'Adding company domains restricts users who can access CheckIT'
echo 'To add no company domains, simply press enter.'
echo 'To add a domain, enter the domain (ex: example.com).'
echo 'To add multiple domains, separate each domain entered by a space (ex: example.com oldexample.com).'
read -p 'Enter the company domains > ' companyDomains

IFS=' ' read -r -a companyDomainsArr <<< "$companyDomains"

COMPANY_DOMAINS='\"companyDomains\":\ \['

isFirstEntry="true"

for element in "${companyDomainsArr[@]}"
do
    if [ "$isFirstEntry" = "true" ]
    then
        isFirstEntry="false"
        COMPANY_DOMAINS=$COMPANY_DOMAINS"\\\"$element\\\""
    else
        COMPANY_DOMAINS=$COMPANY_DOMAINS",\\ \\\"$element\\\""
    fi
done

COMPANY_DOMAINS=$COMPANY_DOMAINS'\]'

echo
echo 'Injecting private information into the following files'
echo '  - client/src/app.config.json'
echo '  - server/config/default.json'
echo

. ./scripts/inject-private-info.sh

echo 'CheckIT setup is complete.'
echo
