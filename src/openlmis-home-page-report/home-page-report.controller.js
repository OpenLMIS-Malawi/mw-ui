/*
 * This program is part of the OpenLMIS logistics management information system platform software.
 * Copyright © 2017 VillageReach
 *
 * This program is free software: you can redistribute it and/or modify it under the terms
 * of the GNU Affero General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *  
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU Affero General Public License for more details. You should have received a copy of
 * the GNU Affero General Public License along with this program. If not, see
 * http://www.gnu.org/licenses.  For additional information contact info@OpenLMIS.org. 
 */

/*
 * MALAWISUP-7386 - TEMPORARY OVERRIDE of openlmis-referencedata-ui.
 *
 * Copied verbatim from openlmis/referencedata-ui:5.6.20-SNAPSHOT.
 * Upstream fix: MW-1449 (2248c7ba).
 *
 * Completes MW-1449 Superset embedded dashboards: adds the Embedded SDK /
 * guest-token render path and the embeddedUuid field on the report admin screen.
 * Without it every Superset report falls back to /oauth-init/openlmis.
 *
 * DELETE THIS FILE once docker-compose.yml pins openlmis/referencedata-ui >= 5.6.20,
 * which contains the same change. Keeping it after that point would silently
 * shadow newer core changes to this file.
 */

(function() {

    'use strict';

    /**
     * @ngdoc controller
     * @name openlmis-home-page-report.controller:OpenlmisHomePageReportController
     * @description
     * Manages the openlmis-home-page-report component. Superset reports with an embedded UUID
     * render via the Embedded SDK (guest token); others fall back to the legacy iframe.
     */
    angular
        .module('openlmis-home-page-report')
        .controller('OpenlmisHomePageReportController', OpenlmisHomePageReportController);

    OpenlmisHomePageReportController.$inject = ['reportDashboardService', 'offlineService', '$sce',
        'supersetOAuthService', '$rootScope', '$state', 'REPORT_TYPES', '$http', '$q', '$element',
        '$scope', 'SUPERSET_URL', 'openlmisUrlFactory', 'messageService'];

    function OpenlmisHomePageReportController(reportDashboardService, offlineService, $sce,
                                              supersetOAuthService, $rootScope, $state, REPORT_TYPES,
                                              $http, $q, $element, $scope, SUPERSET_URL,
                                              openlmisUrlFactory, messageService) {

        var vm = this;
        vm.$onInit = onInit;

        /**
         * @ngdoc property
         * @propertyOf openlmis-home-page-report.controller:OpenlmisHomePageReportController
         * @type {Object}
         * @name report
         *
         * @description
         * Holds information about the home page report
         */
        vm.report = undefined;

        /**
         * @ngdoc property
         * @propertyOf openlmis-home-page-report.controller:OpenlmisHomePageReportController
         * @type {boolean}
         * @name isOffline
         *
         * @description
         * Indicates offline connection.
         */
        vm.isOffline = undefined;

        /**
         * @ngdoc property
         * @propertyOf openlmis-home-page-report.controller:OpenlmisHomePageReportController
         * @name isAuthorized
         * @type {boolean}
         *
         * @description
         * Indicates if the controller is ready for the legacy iframe.
         */
        vm.isAuthorized = false;

        /**
         * @ngdoc property
         * @propertyOf openlmis-home-page-report.controller:OpenlmisHomePageReportController
         * @name isEmbedded
         * @type {boolean}
         *
         * @description
         * Indicates the report is a Superset report rendered via the Embedded SDK.
         */
        vm.isEmbedded = false;

        /**
         * @ngdoc property
         * @propertyOf openlmis-home-page-report.controller:OpenlmisHomePageReportController
         * @name isReady
         * @type {boolean}
         *
         * @description
         * Indicates the embedded dashboard has been initialized and is ready to display.
         */
        vm.isReady = false;

        /**
         * @ngdoc property
         * @propertyOf openlmis-home-page-report.controller:OpenlmisHomePageReportController
         * @name error
         * @type {string}
         *
         * @description
         * Error message to display if embedding fails.
         */
        vm.error = undefined;

        /**
         * @ngdoc method
         * @methodOf openlmis-home-page-report.controller:OpenlmisHomePageReportController
         * @name $onInit
         *
         * @description
         * Method that is executed on initiating HomeSystemNotificationsController.
         */
        function onInit() {
            vm.isOffline = offlineService.isOffline();

            reportDashboardService.getHomePageReport().then(function(report) {
                if (!report.content[0]) {
                    return;
                }
                vm.report = report.content[0];

                if (vm.report.type !== REPORT_TYPES.SUPERSET) {
                    vm.report.url = $sce.trustAsResourceUrl(vm.report.url);
                    vm.isAuthorized = true;
                    return;
                }

                if (vm.report.embeddedUuid) {
                    vm.isEmbedded = true;
                    if (!vm.isOffline) {
                        initSupersetEmbed();
                    }
                    return;
                }

                vm.report.url = $sce.trustAsResourceUrl(vm.report.url);
                if (!vm.isOffline) {
                    checkAuthorizationInSuperset();
                }
            });
        }

        $rootScope.$on('openlmis-auth.authorized-in-superset', function() {
            $state.reload();
        });

        function checkAuthorizationInSuperset() {
            supersetOAuthService.checkAuthorizationInSuperset()
                .then(function(data) {
                    vm.supersetOAuthState = data.state;
                    if (data.isAuthorized === true) {
                        vm.isAuthorized = true;
                    }
                });
        }

        function initSupersetEmbed() {
            loadSupersetSdk().then(function(sdk) {
                var container = $element[0].querySelector('#home-page-superset-embed-container');
                if (!container) {
                    vm.error = messageService.get('openlmisHomePageReport.embed.containerNotFound');
                    $scope.$applyAsync();
                    return;
                }
                sdk.embedDashboard({
                    id: vm.report.embeddedUuid,
                    supersetDomain: SUPERSET_URL,
                    mountPoint: container,
                    fetchGuestToken: fetchGuestToken,
                    dashboardUiConfig: {
                        hideTitle: true,
                        hideChartControls: false,
                        hideTab: false,
                        filters: {
                            visible: true,
                            expanded: false
                        }
                    }
                }).then(function() {
                    vm.isReady = true;
                    $scope.$applyAsync();
                })
                    .catch(function(err) {
                        vm.error = messageService.get('openlmisHomePageReport.embed.failed', {
                            error: err.message
                        });
                        $scope.$applyAsync();
                    });
            })
                .catch(function(err) {
                    vm.error = messageService.get('openlmisHomePageReport.sdk.failed', {
                        error: err.message
                    });
                    $scope.$applyAsync();
                });
        }

        function loadSupersetSdk() {
            if (window.supersetEmbeddedSdk) {
                return $q.resolve(window.supersetEmbeddedSdk);
            }
            return $http.get(SUPERSET_URL + '/static/superset-embedded-sdk.js', {
                transformResponse: function(data) {
                    return data;
                }
            }).then(function(response) {
                new Function(response.data)();
                if (window.supersetEmbeddedSdk) {
                    return window.supersetEmbeddedSdk;
                }
                throw new Error('Superset Embedded SDK failed to initialize');
            });
        }

        function fetchGuestToken() {
            var url = openlmisUrlFactory(
                '/api/reports/superset/guest-token?embeddedUuid=' + vm.report.embeddedUuid
            );
            return $http.get(url)
                .then(function(response) {
                    return response.data.token;
                });
        }
    }
})();
