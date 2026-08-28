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

describe('ReportEditController', function() {

    beforeEach(function() {
        module('admin-report-edit');

        inject(function($injector) {
            this.$controller = $injector.get('$controller');
            this.$rootScope = $injector.get('$rootScope');
            this.$state = $injector.get('$state');
            this.$q = $injector.get('$q');
            this.confirmService = $injector.get('confirmService');
            this.stateTrackerService = $injector.get('stateTrackerService');
            this.loadingModalService = $injector.get('loadingModalService');
            this.notificationService = $injector.get('notificationService');
            this.messageService = $injector.get('messageService');
            this.reportDashboardService = $injector.get('reportDashboardService');
            this.REPORT_TYPES = $injector.get('REPORT_TYPES');
            this.ReportDashboardDataBuilder = $injector.get('ReportDashboardDataBuilder');
            this.ReportCategoryDataBuilder = $injector.get('ReportCategoryDataBuilder');
        });

        this.categories = [
            new this.ReportCategoryDataBuilder().build(),
            new this.ReportCategoryDataBuilder().build()
        ];

        this.dashboardReport = new this.ReportDashboardDataBuilder()
            .withType(this.REPORT_TYPES.SUPERSET)
            .build();
        this.dashboardReport.category = this.categories[0];

        this.reportsList = [this.dashboardReport];

        this.saveDeferred = this.$q.defer();

        spyOn(this.confirmService, 'confirm').andReturn(this.$q.resolve());
        spyOn(this.stateTrackerService, 'goToPreviousState').andReturn(true);
        spyOn(this.reportDashboardService, 'edit').andReturn(this.saveDeferred.promise);
        spyOn(this.reportDashboardService, 'add').andReturn(this.saveDeferred.promise);
        spyOn(this.loadingModalService, 'open').andReturn(true);
        spyOn(this.loadingModalService, 'close').andReturn(true);
        spyOn(this.notificationService, 'success');
        spyOn(this.notificationService, 'error');
        spyOn(this.$state, 'go').andReturn();
        spyOn(this.messageService, 'get').andReturn('confirm-message');

        this.initController = function(dashboardReport) {
            this.vm = this.$controller('ReportEditController', {
                dashboardReport: dashboardReport === undefined ? this.dashboardReport : dashboardReport,
                categories: this.categories,
                reportsList: this.reportsList
            });
            this.vm.$onInit();
        };
    });

    describe('$onInit', function() {

        beforeEach(function() {
            this.initController();
        });

        it('should expose REPORT_TYPES constant for use in the template', function() {
            expect(this.vm.REPORT_TYPES).toBe(this.REPORT_TYPES);
        });

        it('should set editMode to true when a dashboardReport is provided', function() {
            expect(this.vm.editMode).toBe(true);
        });

        it('should set editMode to false when no dashboardReport is provided', function() {
            this.initController(null);

            expect(this.vm.editMode).toBe(false);
        });

        it('should expose all report types', function() {
            expect(this.vm.types).toEqual(this.REPORT_TYPES.getTypes());
        });
    });

    describe('validateField', function() {

        beforeEach(function() {
            this.initController();
        });

        it('should add field name to invalidFields when value is empty', function() {
            this.vm.validateField('', 'name');

            expect(this.vm.invalidFields.has('name')).toBe(true);
        });

        it('should remove field name from invalidFields when value becomes non-empty', function() {
            this.vm.invalidFields.add('name');

            this.vm.validateField('some value', 'name');

            expect(this.vm.invalidFields.has('name')).toBe(false);
        });
    });

    describe('validateSupersetFields', function() {

        beforeEach(function() {
            this.initController();
            this.vm.report.type = this.REPORT_TYPES.SUPERSET;
            this.vm.invalidFields.add('supersetField');
            this.vm.invalidFields.add('url');
        });

        it('should clear supersetField and url errors when url is provided', function() {
            this.vm.report.url = 'https://example.org/dashboard';
            this.vm.report.embeddedUuid = undefined;

            this.vm.validateSupersetFields();

            expect(this.vm.invalidFields.has('supersetField')).toBe(false);
            expect(this.vm.invalidFields.has('url')).toBe(false);
        });

        it('should clear supersetField and url errors when embeddedUuid is provided', function() {
            this.vm.report.url = undefined;
            this.vm.report.embeddedUuid = 'abc-uuid';

            this.vm.validateSupersetFields();

            expect(this.vm.invalidFields.has('supersetField')).toBe(false);
            expect(this.vm.invalidFields.has('url')).toBe(false);
        });

        it('should not clear errors when both url and embeddedUuid are empty', function() {
            this.vm.report.url = '';
            this.vm.report.embeddedUuid = '';

            this.vm.validateSupersetFields();

            expect(this.vm.invalidFields.has('supersetField')).toBe(true);
            expect(this.vm.invalidFields.has('url')).toBe(true);
        });

        it('should be a no-op when type is not SUPERSET', function() {
            this.vm.report.type = this.REPORT_TYPES.POWERBI;
            this.vm.report.url = 'https://example.org/dashboard';

            this.vm.validateSupersetFields();

            expect(this.vm.invalidFields.has('supersetField')).toBe(true);
            expect(this.vm.invalidFields.has('url')).toBe(true);
        });

        it('should flag a malformed embeddedUuid as the user types', function() {
            this.vm.report.url = '';
            this.vm.report.embeddedUuid = 'nope';

            this.vm.validateSupersetFields();

            expect(this.vm.invalidFields.has('embeddedUuidFormat')).toBe(true);
        });

        it('should clear the format error once the embeddedUuid becomes valid', function() {
            this.vm.report.embeddedUuid = 'nope';
            this.vm.validateSupersetFields();

            expect(this.vm.invalidFields.has('embeddedUuidFormat')).toBe(true);

            this.vm.report.embeddedUuid = '7f4258e8-037c-4b27-b44f-367efc243309';
            this.vm.validateSupersetFields();

            expect(this.vm.invalidFields.has('embeddedUuidFormat')).toBe(false);
        });
    });

    describe('onTypeChange', function() {

        beforeEach(function() {
            this.initController();
        });

        it('should add type to invalidFields when type is empty', function() {
            this.vm.report.type = '';

            this.vm.onTypeChange();

            expect(this.vm.invalidFields.has('type')).toBe(true);
        });

        it('should remove type from invalidFields when type is provided', function() {
            this.vm.invalidFields.add('type');
            this.vm.report.type = this.REPORT_TYPES.SUPERSET;

            this.vm.onTypeChange();

            expect(this.vm.invalidFields.has('type')).toBe(false);
        });

        it('should clear supersetField error whenever type changes', function() {
            this.vm.invalidFields.add('supersetField');
            this.vm.report.type = this.REPORT_TYPES.POWERBI;

            this.vm.onTypeChange();

            expect(this.vm.invalidFields.has('supersetField')).toBe(false);
        });

        it('should clear url error when type changes to SUPERSET', function() {
            this.vm.invalidFields.add('url');
            this.vm.report.type = this.REPORT_TYPES.SUPERSET;

            this.vm.onTypeChange();

            expect(this.vm.invalidFields.has('url')).toBe(false);
        });

        it('should not clear url error when type changes to a non-SUPERSET type', function() {
            this.vm.invalidFields.add('url');
            this.vm.report.type = this.REPORT_TYPES.POWERBI;

            this.vm.onTypeChange();

            expect(this.vm.invalidFields.has('url')).toBe(true);
        });
    });

    describe('confirmEdit (validateEditReport)', function() {

        function setReport(vm, overrides) {
            vm.report.name = 'name' in overrides ? overrides.name : 'Report name';
            vm.report.category = 'category' in overrides ? overrides.category : vm.report.category;
            vm.report.type = 'type' in overrides ? overrides.type : vm.report.type;
            vm.report.url = 'url' in overrides ? overrides.url : '';
            vm.report.embeddedUuid = 'embeddedUuid' in overrides ? overrides.embeddedUuid : '';
            vm.report.showOnHomePage = false;
        }

        beforeEach(function() {
            this.initController();
        });

        it('should flag name, category and type when they are empty regardless of report type', function() {
            setReport(this.vm, {
                name: '',
                category: undefined,
                type: ''
            });

            this.vm.confirmEdit();
            this.$rootScope.$apply();

            expect(this.vm.invalidFields.has('name')).toBe(true);
            expect(this.vm.invalidFields.has('category')).toBe(true);
            expect(this.vm.invalidFields.has('type')).toBe(true);
            expect(this.reportDashboardService.edit).not.toHaveBeenCalled();
            expect(this.reportDashboardService.add).not.toHaveBeenCalled();
        });

        it('should require either URL or embeddedUuid when type is SUPERSET', function() {
            setReport(this.vm, {
                type: this.REPORT_TYPES.SUPERSET,
                url: '',
                embeddedUuid: ''
            });

            this.vm.confirmEdit();
            this.$rootScope.$apply();

            expect(this.vm.invalidFields.has('supersetField')).toBe(true);
            expect(this.vm.invalidFields.has('url')).toBe(false);
            expect(this.reportDashboardService.edit).not.toHaveBeenCalled();
        });

        it('should pass validation for SUPERSET when only URL is provided', function() {
            setReport(this.vm, {
                type: this.REPORT_TYPES.SUPERSET,
                url: 'https://example.org/dashboard',
                embeddedUuid: ''
            });

            this.vm.confirmEdit();
            this.$rootScope.$apply();

            expect(this.vm.invalidFields.has('supersetField')).toBe(false);
            expect(this.vm.invalidFields.has('url')).toBe(false);
            expect(this.reportDashboardService.edit).toHaveBeenCalled();
        });

        it('should pass validation for SUPERSET when only a valid embeddedUuid is provided', function() {
            setReport(this.vm, {
                type: this.REPORT_TYPES.SUPERSET,
                url: '',
                embeddedUuid: '7f4258e8-037c-4b27-b44f-367efc243309'
            });

            this.vm.confirmEdit();
            this.$rootScope.$apply();

            expect(this.vm.invalidFields.has('supersetField')).toBe(false);
            expect(this.vm.invalidFields.has('url')).toBe(false);
            expect(this.vm.invalidFields.has('embeddedUuidFormat')).toBe(false);
            expect(this.reportDashboardService.edit).toHaveBeenCalled();
        });

        it('should clear supersetField error when both URL and embeddedUuid are provided', function() {
            setReport(this.vm, {
                type: this.REPORT_TYPES.SUPERSET,
                url: 'https://example.org/dashboard',
                embeddedUuid: '7f4258e8-037c-4b27-b44f-367efc243309'
            });
            this.vm.invalidFields.add('supersetField');

            this.vm.confirmEdit();
            this.$rootScope.$apply();

            expect(this.vm.invalidFields.has('supersetField')).toBe(false);
        });

        it('should reject a malformed embeddedUuid and not save', function() {
            setReport(this.vm, {
                type: this.REPORT_TYPES.SUPERSET,
                url: '',
                embeddedUuid: 'not-a-uuid'
            });

            this.vm.confirmEdit();
            this.$rootScope.$apply();

            expect(this.vm.invalidFields.has('embeddedUuidFormat')).toBe(true);
            expect(this.vm.invalidFields.has('supersetField')).toBe(false);
            expect(this.reportDashboardService.edit).not.toHaveBeenCalled();
        });

        it('should accept a valid embeddedUuid alongside a URL without a format error', function() {
            setReport(this.vm, {
                type: this.REPORT_TYPES.SUPERSET,
                url: 'https://example.org/dashboard',
                embeddedUuid: 'not-a-uuid'
            });

            this.vm.confirmEdit();
            this.$rootScope.$apply();

            // Even though a URL is present, a malformed UUID must still block the save.
            expect(this.vm.invalidFields.has('embeddedUuidFormat')).toBe(true);
            expect(this.reportDashboardService.edit).not.toHaveBeenCalled();
        });

        it('should require URL when type is not SUPERSET', function() {
            setReport(this.vm, {
                type: this.REPORT_TYPES.POWERBI,
                url: '',
                embeddedUuid: 'abc-uuid'
            });

            this.vm.confirmEdit();
            this.$rootScope.$apply();

            expect(this.vm.invalidFields.has('url')).toBe(true);
            expect(this.vm.invalidFields.has('supersetField')).toBe(false);
            expect(this.reportDashboardService.edit).not.toHaveBeenCalled();
        });

        it('should pass validation for non-SUPERSET when URL is provided', function() {
            setReport(this.vm, {
                type: this.REPORT_TYPES.POWERBI,
                url: 'https://example.org/dashboard'
            });

            this.vm.confirmEdit();
            this.$rootScope.$apply();

            expect(this.vm.invalidFields.has('url')).toBe(false);
            expect(this.reportDashboardService.edit).toHaveBeenCalled();
        });

        it('should call add when there is no existing dashboardReport', function() {
            this.initController(null);
            this.vm.report = {
                name: 'New report',
                category: this.categories[0],
                type: this.REPORT_TYPES.SUPERSET,
                url: 'https://example.org/dashboard',
                embeddedUuid: '',
                showOnHomePage: false
            };

            this.vm.confirmEdit();
            this.$rootScope.$apply();

            expect(this.reportDashboardService.add).toHaveBeenCalled();
            expect(this.reportDashboardService.edit).not.toHaveBeenCalled();
        });
    });
});
