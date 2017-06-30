# CheckIT Scripts

Scripts used to set up and build CheckIT are included within the scripts directory. The purpose of each script is described below:

* `jenkins/jenkins-build-checkit.sh` - Builds the CheckIT project on a Jenkins server.
* `clean-and-install-dependencies.sh` - Removes any existing bower_components and node_modules folders and 
installs bower and npm dependencies.
* `inject-private-info.sh` - Injects private information into the `client/src/app.config.json` and 
`server/config/default.json` files.
* `setup.sh` - Installs all dependencies, prompts user for credentials needed for CheckIT, and injects private info.

## Jenkins Deployment

The jenkins directory contains scripts used to build CheckIT on a Jenkins server. In order to build CheckIT on a 
Jenkins server, first create a project on a Jenkins server and configure the build to use the 
`https://github.com/PointSource/checkit-blueoak.git` repository (or your own forked repository) in the "Source Control 
Management" section. To configure the build, click "Add build step" followed by "Execute shell". Then add the code 
below to the execute shell text box. Add the necessary credentials and save the build configuration. CheckIT is now 
ready to be built.

```
# This script is meant to be a template to copy into an "Execute shell" on Jenkins
# Copy the contents below and add the credentials

# Disables logging to the console
set +x

# Add credentials below
API="ENTER_API_HOST"
ALLOWED_ORIGINS="ENTER_ALLOWED_ORIGINS"
GOOGLE_CLIENT_ID="ENTER_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="ENTER_GOOGLE_CLIENT_SECRET"
MONGODB_HOST="ENTER_MONGODB_HOST"
MONGODB_PORT="ENTER_MONGODB_PORT"
MONGODB_DB="ENTER_MONGODB_DB"
MONGODB_USERNAME="ENTER_MONGODB_USERNAME"
MONGODB_PASSWORD="ENTER_MONGODB_PASSWORD"
DECRYPTION_PASSWORD="ENTER_DECRYPTION_PASSWORD"

# Enter the company domains to restrict users who can access CheckIT.
# To allow any user with a Gmail account, leave this field alone.
# To restrict users, enter the domain in the format below, replace "example.com" with your domain:
#     "\"companyDomains\":\ \[\"example.com\"\]"
# Multiple domains can be used and must be separated by a comma.
COMPANY_DOMAINS="\"companyDomains\":\ \[\]"

# Enables logging to the console
set -x

# Changes into the absolute path of the directory assigned to the build as a workspace in Jenkins
cd $WORKSPACE
# Runs the build-checkit.sh script on Jenkins
. ./scripts/jenkins/jenkins-build-checkit.sh
```
