# OpenLMIS Malawi UI
This user interface is designed to be a single page web application that is optimized for offline and low-bandwidth environments.

Multiple UI modules are compiled together with the OpenLMIS dev-ui to create the OpenLMIS Reference-UI. UI modules included in the OpenLMIS Reference-UI are:
* [OpenLMIS Auth UI](https://github.com/OpenLMIS/openlmis-auth-ui)
* [OpenLMIS Fulfillment UI](https://github.com/OpenLMIS/openlmis-fulfillment-ui)
* [OpenLMIS Reference Data UI](https://github.com/OpenLMIS/openlmis-referencedata-ui)
* [OpenLMIS Report UI](https://github.com/OpenLMIS/openlmis-report-ui)
* [OpenLMIS Requisition UI](https://github.com/OpenLMIS/openlmis-requisition-ui)
* [OpenLMIS UI Components](https://github.com/OpenLMIS/openlmis-ui-components)
* [OpenLMIS UI Layout](https://github.com/OpenLMIS/openlmis-ui-layout)
* [DHIS2 Integration UI](https://github.com//OpenLMIS-Malawi/mw-dhis2-integration-ui)


## Prerequisites
* Docker 1.11+
* Docker Compose 1.6+

## Quick Start
1. Fork/clone this repository from GitHub.

 ```shell
> git clone https://github.com/OpenLMIS-Malawi/mw-ui
> cd mw-ui/
 ```
2. Create a .env file, which can be used to overwrite 'sensitive' settings from config.json
```shell
> touch .env
```
3. Env properties you can get from Malawi Confluence
4. Develop w/ Docker by running `docker-compose run --service-ports mw-ui`.
5. You should now be in an interactive shell inside the newly created development environment, build the project with:
```shell
$ npm i 
// or
$ npm install // installs the NodeJS tools

$ grunt // build first time project locally

$ grunt build --serve --openlmisServerURL=https://lmis-uat.health.gov.mw --noTest 

// open project with dedicated openlmisServerURL, flag `--noTest` is optional
```
6. Go to `http://localhost:9000/webapp/` to see the login page.

## Building & Testing
See the [OpenLMIS/dev-ui project](https://github.com/OpenLMIS/dev-ui) for more information on what commands are available, below are the command you might use during a normal work day.

```shell
// Open docker in an interactive shell
> docker-compose run --service-ports mw-ui

// Install dependencies 
$ npm install
$ grunt clean
$ grunt bower

// Build and run the UI against a OpenLMIS server
$ grunt build --serve --openlmisServerURL=https://lmis-uat.health.gov.mw

// Run unit tests
$ grunt karma:unit

// Run a watch process that will build and test your code
// NOTE: You must change a file at least once before your code is rebuilt
$ grunt build --serve --openlmisServerURL=https://lmis-uat.health.gov.mw

```