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

describe('openlmis.reports.list state', function() {

    beforeEach(function() {
        module('report');

        inject(function($injector) {
            this.$state = $injector.get('$state');
            this.$rootScope = $injector.get('$rootScope');
            this.$q = $injector.get('$q');
            this.reportFactory = $injector.get('reportFactory');
            this.reportCategoryService = $injector.get('reportCategoryService');
            this.reportDashboardService = $injector.get('reportDashboardService');
            this.$location = $injector.get('$location');
            this.REPORT_RIGHTS = $injector.get('REPORT_RIGHTS');
        });

        this.jasperReports = [
            {
                id: 'id-one',
                name: 'Report 1',
                $module: 'moduleOne'
            },
            {
                id: 'id-two',
                name: 'Report 2',
                $module: 'moduleTwo'
            }
        ];

        this.reportCategories = {
            content: [
                {
                    name: 'Administartion'
                },
                {
                    name: 'Orders'
                }
            ]
        };

        this.dashboardReportsList = {
            content: [
                {
                    id: 'id-three',
                    name: 'Report 3',
                    category: {
                        name: 'Administartion'
                    }
                },
                {
                    id: 'id-four',
                    name: 'Report 4',
                    category: {
                        name: 'Orders'
                    }
                }
            ]
        };

        spyOn(this.reportFactory, 'getAllReports').andReturn(this.$q.resolve(this.jasperReports));
        spyOn(this.reportCategoryService, 'getAll').andReturn(this.$q.resolve(this.reportCategories));
        spyOn(this.reportDashboardService, 'getAllForUser').andReturn(this.$q.resolve(this.dashboardReportsList));

        this.goToUrl = goToUrl;
        this.getResolvedValue = getResolvedValue;

        this.state = this.$state.get('openlmis.reports.list');
    });

    it('should be available under "/reports/list" URI', function() {
        expect(this.$state.current.name).not.toEqual('openlmis.reports.list');

        this.goToUrl('/reports/list');

        expect(this.$state.current.name).toEqual('openlmis.reports.list');
    });

    it('should fetch reports', function() {
        this.goToUrl('/reports/list');

        expect(this.getResolvedValue('jasperReports')).toEqual(this.jasperReports);
        expect(this.getResolvedValue('reportCategories')).toEqual(this.reportCategories.content);
        expect(this.getResolvedValue('dashboardReportsList')).toEqual(this.dashboardReportsList.content);
    });

    it('should register a static parameterized dashboard leaf state', function() {
        var parent = this.$state.get('openlmis.reports.list.dashboard');
        var leaf = this.$state.get('openlmis.reports.list.dashboard.view');

        expect(parent.abstract).toBe(true);
        expect(leaf).not.toBeNull();
        expect(leaf.url).toEqual('/:reportId');
    });

    it('should resolve the dashboard by reportId from the URL', function() {
        this.goToUrl('/reports/list/dashboard/id-four');

        expect(this.$state.current.name).toEqual('openlmis.reports.list.dashboard.view');
        expect(this.getResolvedValue('currentReport')).toEqual(this.dashboardReportsList.content[1]);
        expect(this.getResolvedValue('reportName')).toEqual('Report 4');
    });

    function goToUrl(url) {
        this.$location.url(url);
        this.$rootScope.$apply();
    }

    function getResolvedValue(name) {
        return this.$state.$current.locals.globals[name];
    }

});