# CheckIT

CheckIT is a [BlueOak-based](https://github.com/BlueOakJS) application meant for easily checking out organizational assets, and is geared toward devices as the type of assets used.

The instructions below will get you set up to use CheckIT locally. For additional information about the project, please visit the [wiki](https://github.com/PointSource/checkit-blueoak/wiki).

## Technology Frameworks

Client side is written with AngularJS.

Server side is written with Node.js and built using Swagger.io for the endpoints. MongoDB is used as the database.

BlueOakJS is used for the [server](https://github.com/BlueOakJS/blueoak-server), [build process](https://github.com/BlueOakJS/blueoak-build), and to [generate views](https://github.com/BlueOakJS/generator-blueoak).

For more information about different app components, [please refer to our wiki](https://github.com/PointSource/checkit-blueoak/wiki/App-Components).

## Getting Started

In order to use the CheckIT application, you will need the following programs on your computer (see below for instructions on how to install each of these):
* Git
* Node.js
* Bower
* Cordova

### Programs Needed

Each of the sections below outlines how to install the necessary programs. If you don't have any of these programs, download them before using CheckIT.

#### Git

Install Git on your computer using the installer for your OS below:
* [Git](http://git-scm.com/downloads)
* [Git for Windows](http://git-for-windows.github.io)

#### Node.js

Download Node.js [here](https://nodejs.org/en/download/) and follow the on-screen installation instructions.

#### Bower

Install [Bower](http://bower.io) via the command line by running `npm install -g bower`.

#### Cordova

Install [Cordova](https://cordova.apache.org/) via the command line by running `npm install -g cordova`.

### Clone the Repository

Run the command below to clone the repository, where `checkit` is the name of the application.

**Clone via https**
```
git clone https://github.com/PointSource/checkit-blueoak.git checkit
```

**Clone via ssh**
```
git clone git@github.com:PointSource/checkit-blueoak.git checkit
```

## Installation

Before installing the CheckIT project, you will need to create a [Google Project](https://console.developers.google.com/apis/dashboard) and a [local MongoDB](https://docs.mongodb.com/manual/administration/install-community/). See the [Initial Project Setup](https://github.com/PointSource/checkit-blueoak/wiki/Initial-Project-Setup) page on the wiki for more information on how to create the necessary credentials.

Once the necessary credentials have been created, installation of the CheckIT project can be easily completed using the setup.sh script in the scripts directory. First, clone the repository using the instructions above and ensure you have all of the necessary programs on your computer. Then, navigate to the checkit folder on your computer and run the following command: `./scripts/setup.sh`. The setup script will guide you through the setup process.

## Usage

The CheckIT application can be deployed on the following platforms:
* Local/Web Deployment
* iOS Deployment
* Android Deployment

To get the application running locally, first follow the installation instructions above. Then, in two separate terminal windows, navigate to the checkit folder and run the commands below. Be sure to run the commands for "Terminal One" before running commands for "Terminal Two" to ensure the server will run on port 3000 (no other program can be running on port 3000).

```
# Terminal One
cd server
nodemon

# Terminal Two
cd client
gulp serve-spa
```

For instructions on deploying a web-based production version of the application or deploying the application on a device, visit the [Deployment](https://github.com/PointSource/checkit-blueoak/wiki/Deployment) page of the wiki.
