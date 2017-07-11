#!/bin/bash

# WARNING: DO NOT COMMIT "client/src/app.config.json" OR "server/config/default.json" AFTER RUNNING THIS SCRIPT
# This script injects private information into the client/src/app.config.json and server/config/default.json files
# and the files should be sanitized before committing any other changes to the files.

# Injects the API host into the client/src/app.config.json file
sed -i "s|http://localhost:3000|$API|g" $WORKSPACE/client/src/app.config.json
# Injects the Allowed Origins into the server/config/default.json file
sed -i "s|http://localhost:3001|$ALLOWED_ORIGINS|g" $WORKSPACE/server/config/default.json
# Injects the Google client ID into the client/src/app.config.json file
sed -i "s|SET_GOOGLE_CLIENT_ID_HERE|$GOOGLE_CLIENT_ID|g" $WORKSPACE/client/src/app.config.json
# Injects the Mongo DB host into the client/src/app.config.json file
sed -i "s|SET_MONGODB_HOST_HERE|$MONGODB_HOST|g" $WORKSPACE/server/config/default.json
# Injects the Mongo DB port into the client/src/app.config.json file
sed -i "s|SET_MONGODB_PORT_HERE|$MONGODB_PORT|g" $WORKSPACE/server/config/default.json
# Injects the Mongo DB database into the client/src/app.config.json file
sed -i "s|SET_MONGODB_DB_HERE|$MONGODB_DB|g" $WORKSPACE/server/config/default.json
# Injects the Mongo DB username into the client/src/app.config.json file
sed -i "s|SET_MONGODB_USERNAME_HERE|$MONGODB_USERNAME|g" $WORKSPACE/server/config/default.json
# Injects the Mongo DB password into the client/src/app.config.json file
sed -i "s|SET_MONGODB_PASSWORD_HERE|$MONGODB_PASSWORD|g" $WORKSPACE/server/config/default.json
# Injects the database decryption password into the client/src/app.config.json file
sed -i "s|SET_DECRYPTION_PASSWORD_HERE|$DECRYPTION_PASSWORD|g" $WORKSPACE/server/config/default.json
# Injects the Google domain into the client/src/app.config.json file
sed -i "s|SET_GOOGLE_DOMAIN_HERE|$GOOGLE_DOMAIN|g" $WORKSPACE/server/config/default.json
# Injects the service account email into the client/src/app.config.json file
sed -i "s|SET_SERVICE_ACCOUNT_EMAIL_HERE|$SERVICE_ACCOUNT_EMAIL|g" $WORKSPACE/server/config/default.json
# Injects the service account key file path into the client/src/app.config.json file
sed -i "s|SET_SERVICE_ACCOUNT_KEY_FILE_PATH_HERE|$SERVICE_ACCOUNT_KEY_FILE_PATH|g" $WORKSPACE/server/config/default.json
# Injects the app account email into the client/src/app.config.json file
sed -i "s|SET_APP_ACCOUNT_EMAIL_HERE|$APP_ACCOUNT_EMAIL|g" $WORKSPACE/server/config/default.json
# Injects the company domains into the client/src/app.config.json file
sed -i "s|\"companyDomains\":\ \[\]|$COMPANY_DOMAINS|g" $WORKSPACE/server/config/default.json

# Log that private information has been successfully injected
echo "Private information successfully injected"
echo
