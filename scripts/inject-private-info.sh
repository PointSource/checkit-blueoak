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
# Injects the Mongo DB host into the server/config/default.json file
sed -i "s|SET_MONGODB_HOST_HERE|$MONGODB_HOST|g" $WORKSPACE/server/config/default.json
# Injects the Mongo DB port into the server/config/default.json file
sed -i "s|SET_MONGODB_PORT_HERE|$MONGODB_PORT|g" $WORKSPACE/server/config/default.json
# Injects the Mongo DB database into the server/config/default.json file
sed -i "s|SET_MONGODB_DB_HERE|$MONGODB_DB|g" $WORKSPACE/server/config/default.json
# Injects the Mongo DB username into the server/config/default.json file
sed -i "s|SET_MONGODB_USERNAME_HERE|$MONGODB_USERNAME|g" $WORKSPACE/server/config/default.json
# Injects the Mongo DB password into the server/config/default.json file
sed -i "s|SET_MONGODB_PASSWORD_HERE|$MONGODB_PASSWORD|g" $WORKSPACE/server/config/default.json
# Injects the database decryption password into the server/config/default.json file
sed -i "s|SET_DECRYPTION_PASSWORD_HERE|$DECRYPTION_PASSWORD|g" $WORKSPACE/server/config/default.json
# Injects the Google domain into the server/config/default.json file
sed -i "s|SET_DOMAIN_HERE|$GOOGLE_DOMAIN|g" $WORKSPACE/server/config/default.json
# Injects the service account email into the server/config/default.json file
sed -i "s|SET_SERVICE_ACCOUNT_EMAIL_HERE|$SERVICE_ACCOUNT_EMAIL|g" $WORKSPACE/server/config/default.json
# Injects the service account key file path into the server/config/default.json file
sed -i "s|SET_SERVICE_ACCOUNT_KEY_FILE_PATH_HERE|$SERVICE_ACCOUNT_KEY_FILE_PATH|g" $WORKSPACE/server/config/default.json
# Injects the app account email into the server/config/default.json file
sed -i "s|SET_APP_ACCOUNT_EMAIL_HERE|$APP_ACCOUNT_EMAIL|g" $WORKSPACE/server/config/default.json
# Injects the notification method into the server/config/default.json file
sed -i "s|SET_NOTIFICATION_METHOD_HERE|$NOTIFICATION_METHOD|g" $WORKSPACE/server/config/default.json
if [ "$NOTIFICATION_METHOD" = "hipchat" ]
then
	# Injects the HipChat Domain into the server/config/default.json file
    sed -i "s|SET_HIPCHAT_DOMAIN_HERE|$HIPCHAT_DOMAIN|g" $WORKSPACE/server/config/default.json
    # Injects the HipChat Room ID into the server/config/default.json file
    sed -i "s|SET_HIPCHAT_ROOM_ID_HERE|$HIPCHAT_ROOM_ID|g" $WORKSPACE/server/config/default.json
    # Injects the HipChat Auth Token into the server/config/default.json file
    sed -i "s|SET_HIPCHAT_AUTH_TOKEN_HERE|$HIPCHAT_AUTH_TOKEN|g" $WORKSPACE/server/config/default.json
fi
# Injects the company domains into the server/config/default.json file
sed -i "s|\"companyDomains\":\ \[\]|$COMPANY_DOMAINS|g" $WORKSPACE/server/config/default.json
# Injects the reverse client ID into the client/cordova/package.json file
sed -i "s|SET_IOS_REVERSE_CLIENT_ID_HERE|$IOS_REVERSE_CLIENT_ID|g" $WORKSPACE/client/cordova/package.json

# Log that private information has been successfully injected
echo "Private information successfully injected"
echo
