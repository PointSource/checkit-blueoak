#!/bin/bash

# Removes existing bower_components and node_modules directories and installs bower and npm dependencies

cd ./client
rm -r node_modules
rm -r bower_components
npm install
bower install --allow-root

cd ../server
rm -r node_modules
npm install

cd ..

echo
echo 'Dependencies successfully installed'
echo
