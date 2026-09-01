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
 * MALAWISUP-7386 - TEMPORARY OVERRIDE of openlmis-report-ui.
 *
 * Copied verbatim from openlmis/report-ui:5.2.16-SNAPSHOT.
 * Upstream fix: MW-1449 (7a82ae9f).
 *
 * Completes MW-1449 on the Reports page: a report with an embeddedUuid renders
 * through the Superset Embedded SDK. Without this controller the route resolves
 * reportUrl to null and the page shows a blank iframe.
 *
 * DELETE THIS FILE once docker-compose.yml pins openlmis/report-ui >= 5.2.16,
 * which contains the same change. Keeping it after that point would silently
 * shadow newer core changes to this file.
 */

(function() {

    'use strict';

    /**
     * @ngdoc controller
     * @name report.controller:DashboardReportController
     *
     * @description
     * Controller for dashboard report view. For Superset reports with an embedded UUID,
     * uses the Superset Embedded SDK to render the dashboard via a guest token.
     * For Superset reports without an embedded UUID, falls back to the legacy
     * OAuth iframe approach.
     */
    angular
        .module('report')
        .controller('DashboardReportController', DashboardReportController);

    DashboardReportController.$inject = ['reportName', 'isSupersetReport', 'reportUrl',
        'embeddedUuid', '$http', '$q', '$element', '$scope', '$timeout', 'SUPERSET_URL',
        'openlmisUrlFactory', 'loadingModalService', 'messageService', 'supersetLocaleService'];

    function DashboardReportController(reportName, isSupersetReport, reportUrl,
                                       embeddedUuid, $http, $q, $element, $scope, $timeout,
                                       SUPERSET_URL, openlmisUrlFactory, loadingModalService,
                                       messageService, supersetLocaleService) {
        var vm = this;
        vm.$onInit = onInit;

        /**
         * @ngdoc property
         * @propertyOf report.controller:DashboardReportController
         * @name reportName
         * @type {string}
         *
         * @description
         * The report name.
         */
        vm.reportName = undefined;

        /**
         * @ngdoc property
         * @propertyOf report.controller:DashboardReportController
         * @name reportUrl
         * @type {string}
         *
         * @description
         * The report URL (used for non-Superset reports and legacy OAuth iframe).
         */
        vm.reportUrl = undefined;

        /**
         * @ngdoc property
         * @propertyOf report.controller:DashboardReportController
         * @name isSupersetReport
         * @type {boolean}
         *
         * @description
         * Whether this is a Superset report.
         */
        vm.isSupersetReport = false;

        /**
         * @ngdoc property
         * @propertyOf report.controller:DashboardReportController
         * @name authUrl
         * @type {string}
         *
         * @description
         * The Superset OAuth authorization URL (legacy iframe path only).
         */
        vm.authUrl = undefined;

        /**
         * @ngdoc property
         * @propertyOf report.controller:DashboardReportController
         * @name isReady
         * @type {boolean}
         *
         * @description
         * Indicates if the dashboard has been initialized and is ready to display.
         */
        vm.isReady = false;

        /**
         * @ngdoc property
         * @propertyOf report.controller:DashboardReportController
         * @name error
         * @type {string}
         *
         * @description
         * Error message to display if embedding fails.
         */
        vm.error = undefined;

        function onInit() {
            vm.reportName = reportName;
            vm.reportUrl = reportUrl;
            vm.isSupersetReport = isSupersetReport;

            if (vm.isSupersetReport && embeddedUuid) {
                initSupersetEmbed();
            } else if (vm.isSupersetReport) {
                vm.authUrl = SUPERSET_URL + '/login/openlmis';
                adjustSupersetLanguage();
            }
        }

        function adjustSupersetLanguage() {
            loadingModalService.open();

            var locale = messageService.getCurrentLocale();
            supersetLocaleService.changeLocale(locale)
                .then(function() {
                    vm.isReady = true;
                })
                .finally(function() {
                    loadingModalService.close();
                });
        }

        function initSupersetEmbed() {
            loadSupersetSdk().then(function(sdk) {
                // The #superset-embed-container element is added by an ng-if that only
                // resolves on a digest after $onInit. On the first visit the SDK is
                // fetched over HTTP, which delays this callback past that render; on a
                // repeat visit the SDK is already cached, so this resolves within the
                // same digest — before the container exists — which previously surfaced
                // as "Embedded container not found". Defer to $timeout so the element is
                // present regardless of which SDK-load path ran.
                $timeout(function() {
                    var container = $element[0].querySelector('#superset-embed-container');
                    if (!container) {
                        vm.error = messageService.get('report.superset.embed.containerNotFound');
                        return;
                    }
                    sdk.embedDashboard({
                        id: embeddedUuid,
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
                            vm.error = messageService.get('report.superset.embed.failed', {
                                error: err.message
                            });
                            $scope.$applyAsync();
                        });
                });
            })
                .catch(function(err) {
                    vm.error = messageService.get('report.superset.sdk.failed', {
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
            const url = openlmisUrlFactory(
                '/api/reports/superset/guest-token?embeddedUuid=' + embeddedUuid
            );
            return $http.get(url)
                .then(function(response) {
                    return response.data.token;
                });
        }
    }

})();
