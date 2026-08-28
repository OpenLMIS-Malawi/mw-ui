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
 * Completes MW-1449 Superset embedded dashboards: the report route now skips
 * the legacy OAuth modal when the report has an embeddedUuid. Without it every
 * Superset report calls /oauth-init/openlmis, which no deployed Superset serves.
 *
 * DELETE THIS FILE once docker-compose.yml pins openlmis/report-ui >= 5.2.16,
 * which contains the same change. Keeping it after that point would silently
 * shadow newer core changes to this file.
 */

(function() {

    'use strict';

    angular
        .module('report')
        .config(config);

    config.$inject = ['$stateProvider', 'REPORT_RIGHTS'];

    function config($stateProvider, REPORT_RIGHTS) {

        $stateProvider.state('openlmis.reports.list', {
            controller: 'ReportListController',
            controllerAs: 'vm',
            label: 'report.viewReports',
            showInNavigation: true,
            templateUrl: 'report/report-list.html',
            url: '/list',
            accessRights: [
                REPORT_RIGHTS.REPORTS_VIEW
            ],
            resolve: {
                reportCategories: function(reportCategoryService) {
                    return reportCategoryService.getAll().then(function(categories) {
                        return categories.content;
                    });
                },
                jasperReports: function(reportFactory) {
                    return reportFactory.getAllReports();
                },
                dashboardReportsList: function(reportDashboardService) {
                    return reportDashboardService.getAllForUser().then(function(response) {
                        return response.content;
                    });
                }
            }
        });

        // Abstract parent renders the full-page wrapper into the root ui-view; the report list
        // has no ui-view of its own. The leaf holds the report, parameterized by id.
        $stateProvider.state('openlmis.reports.list.dashboard', {
            abstract: true,
            url: '/dashboard',
            views: {
                '@': {
                    templateUrl: 'openlmis-main-state/flex-page.html'
                }
            }
        });

        $stateProvider.state('openlmis.reports.list.dashboard.view', {
            url: '/:reportId',
            controller: 'DashboardReportController',
            controllerAs: 'vm',
            templateUrl: 'report/dashboard-report.html',
            resolve: {
                currentReport: function($q, $stateParams, reportDashboardService) {
                    return reportDashboardService.getAllForUser().then(function(response) {
                        var found = response.content.filter(function(item) {
                            return item.id === $stateParams.reportId;
                        })[0];
                        return found ? found : $q.reject('Dashboard report not found');
                    });
                },
                reportName: function(currentReport, $state) {
                    // Set the state label so the breadcrumb shows the report name.
                    $state.get('openlmis.reports.list.dashboard.view').label = currentReport.name;
                    return currentReport.name;
                },
                isSupersetReport: function(currentReport, REPORT_TYPES) {
                    return currentReport.type === REPORT_TYPES.SUPERSET;
                },
                reportUrl: function(currentReport, REPORT_TYPES, $sce) {
                    if (currentReport.type === REPORT_TYPES.SUPERSET) {
                        if (currentReport.embeddedUuid) {
                            return null;
                        }
                        return $sce.trustAsResourceUrl(currentReport.url + '?standalone=true');
                    }
                    return $sce.trustAsResourceUrl(currentReport.url);
                },
                embeddedUuid: function(currentReport, REPORT_TYPES) {
                    return currentReport.type === REPORT_TYPES.SUPERSET ? currentReport.embeddedUuid : null;
                },
                authorizationInSuperset: function(currentReport, REPORT_TYPES, loadingModalService,
                    openlmisModalService, $q, $state, MODAL_CANCELLED) {
                    // Embedded reports authorize via guest token; only legacy ones need the modal.
                    if (currentReport.type !== REPORT_TYPES.SUPERSET || currentReport.embeddedUuid) {
                        return $q.resolve();
                    }
                    loadingModalService.close();
                    var dialog = openlmisModalService.createDialog({
                        backdrop: 'static',
                        keyboard: false,
                        controller: 'SupersetOAuthLoginController',
                        controllerAs: 'vm',
                        templateUrl: 'openlmis-superset/superset-oauth-login.html',
                        show: true
                    });
                    return dialog.promise
                        .catch(function(reason) {
                            if (reason === MODAL_CANCELLED) {
                                $state.go('openlmis.reports.list');
                                return $q.resolve();
                            }
                            return $q.reject();
                        });
                }
            }
        });
    }
})();
