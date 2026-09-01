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

describe('DashboardReportController', function() {

    const that = this;

    beforeEach(function() {
        that.SUPERSET_URL = 'http://localhost/superset';
        that.reportName = 'Test Report';
        that.reportUrl = null;
        that.isSupersetReport = true;
        that.embeddedUuid = 'test-embedded-uuid-1234';

        module('report', function($provide) {
            $provide.constant('SUPERSET_URL', that.SUPERSET_URL);
        });

        inject(function($injector) {
            that.$controller = $injector.get('$controller');
            that.$q = $injector.get('$q');
            that.$rootScope = $injector.get('$rootScope');
            that.$scope = that.$rootScope.$new();
            that.$http = $injector.get('$http');
            that.$timeout = $injector.get('$timeout');
            that.openlmisUrlFactory = $injector.get('openlmisUrlFactory');

            that.supersetLocaleService = $injector.get('supersetLocaleService');
        });

        spyOn(that.supersetLocaleService, 'changeLocale').andReturn(that.$q.resolve());

        // Mock $element with a querySelector that returns null (no DOM in unit tests)
        that.$element = [{
            querySelector: function() {
                return null;
            }
        }];

        that.vm = that.$controller('DashboardReportController', {
            reportName: that.reportName,
            reportUrl: that.reportUrl,
            isSupersetReport: that.isSupersetReport,
            embeddedUuid: that.embeddedUuid,
            $element: that.$element,
            $scope: that.$scope
        });
    });

    describe('onInit with embeddedUuid', function() {

        beforeEach(function() {
            that.vm.$onInit();
        });

        it('should expose isSupersetReport flag', function() {
            expect(that.vm.isSupersetReport).toEqual(that.isSupersetReport);
        });

        it('should expose report name', function() {
            expect(that.vm.reportName).toEqual(that.reportName);
        });

        it('should expose reportUrl as null for embedded Superset reports', function() {
            expect(that.vm.reportUrl).toBeNull();
        });

        it('should not show error when embeddedUuid is provided', function() {
            expect(that.vm.error).toBeUndefined();
        });

        it('should not set authUrl for embedded path', function() {
            expect(that.vm.authUrl).toBeUndefined();
        });

        it('should not call supersetLocaleService', function() {
            expect(that.supersetLocaleService.changeLocale).not.toHaveBeenCalled();
        });
    });

    describe('onInit without embeddedUuid (OAuth fallback)', function() {

        beforeEach(function() {
            that.vm = that.$controller('DashboardReportController', {
                reportName: that.reportName,
                reportUrl: that.SUPERSET_URL + '/superset/dashboard/1/?standalone=true',
                isSupersetReport: true,
                embeddedUuid: null,
                $element: that.$element,
                $scope: that.$scope
            });
            that.vm.$onInit();
        });

        it('should set authUrl for OAuth login', function() {
            expect(that.vm.authUrl).toEqual(that.SUPERSET_URL + '/login/openlmis');
        });

        it('should call supersetLocaleService to adjust language', function() {
            expect(that.supersetLocaleService.changeLocale).toHaveBeenCalled();
        });

        it('should set isReady after locale adjustment', function() {
            that.$rootScope.$apply();

            expect(that.vm.isReady).toBe(true);
        });

        it('should not show error', function() {
            expect(that.vm.error).toBeUndefined();
        });
    });

    describe('onInit for non-Superset report', function() {

        beforeEach(function() {
            that.vm = that.$controller('DashboardReportController', {
                reportName: 'Jasper Report',
                reportUrl: 'http://example.com/report',
                isSupersetReport: false,
                embeddedUuid: null,
                $element: that.$element,
                $scope: that.$scope
            });
            that.vm.$onInit();
        });

        it('should expose reportUrl for non-Superset reports', function() {
            expect(that.vm.reportUrl).toEqual('http://example.com/report');
        });

        it('should not set isSupersetReport', function() {
            expect(that.vm.isSupersetReport).toEqual(false);
        });

        it('should not show error', function() {
            expect(that.vm.error).toBeUndefined();
        });

        it('should not set authUrl', function() {
            expect(that.vm.authUrl).toBeUndefined();
        });
    });

    describe('SDK loading', function() {

        let $httpBackend, sdkUrl, savedSdk;

        beforeEach(function() {
            inject(function($injector) {
                $httpBackend = $injector.get('$httpBackend');
            });

            sdkUrl = that.SUPERSET_URL + '/static/superset-embedded-sdk.js';

            savedSdk = window.supersetEmbeddedSdk;
            window.supersetEmbeddedSdk = undefined;

            that.$element = [{
                querySelector: function() {
                    return document.createElement('div');
                }
            }];
        });

        afterEach(function() {
            window.supersetEmbeddedSdk = savedSdk;
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('should load SDK via $http and set it on window', function() {
            const scriptBody =
                'window.supersetEmbeddedSdk = {' +
                '  embedDashboard: function() {' +
                '    return Promise.resolve();' +
                '  }' +
                '};';
            $httpBackend.expectGET(sdkUrl).respond(200, scriptBody);

            const vm = that.$controller('DashboardReportController', {
                reportName: that.reportName,
                reportUrl: that.reportUrl,
                isSupersetReport: true,
                embeddedUuid: 'test-uuid',
                $element: that.$element,
                $scope: that.$scope
            });

            vm.$onInit();
            $httpBackend.flush();
            that.$rootScope.$digest();

            expect(window.supersetEmbeddedSdk).toBeDefined();
            expect(window.supersetEmbeddedSdk.embedDashboard)
                .toBeDefined();
        });

        it('should set error when SDK load fails', function() {
            $httpBackend.expectGET(sdkUrl).respond(500, 'Server Error');

            const vm = that.$controller('DashboardReportController', {
                reportName: that.reportName,
                reportUrl: that.reportUrl,
                isSupersetReport: true,
                embeddedUuid: 'test-uuid',
                $element: that.$element,
                $scope: that.$scope
            });

            vm.$onInit();
            $httpBackend.flush();
            that.$rootScope.$digest();

            expect(vm.error).toContain('report.superset.sdk.failed');
        });

        it('should not make HTTP request when SDK is cached', function() {
            window.supersetEmbeddedSdk = {
                embedDashboard: function() {
                    return that.$q.resolve({});
                }
            };

            const vm = that.$controller('DashboardReportController', {
                reportName: that.reportName,
                reportUrl: that.reportUrl,
                isSupersetReport: true,
                embeddedUuid: 'test-uuid',
                $element: that.$element,
                $scope: that.$scope
            });

            vm.$onInit();
            that.$rootScope.$digest();

            // No $httpBackend requests expected — verifyNoOutstanding
            // in afterEach confirms no HTTP was made
            expect(vm.error).toBeUndefined();
        });

        it('should defer embedding to a $timeout when SDK is cached (repeat-visit fix)', function() {
            var embedCalled = false;
            window.supersetEmbeddedSdk = {
                embedDashboard: function() {
                    embedCalled = true;
                    return that.$q.resolve({});
                }
            };
            that.$element = [{
                querySelector: function() {
                    return document.createElement('div');
                }
            }];

            const vm = that.$controller('DashboardReportController', {
                reportName: that.reportName,
                reportUrl: that.reportUrl,
                isSupersetReport: true,
                embeddedUuid: 'test-uuid',
                $element: that.$element,
                $scope: that.$scope
            });

            vm.$onInit();
            that.$rootScope.$digest();

            // With the cached SDK the embed must NOT run synchronously — it is
            // deferred so the ng-if container has rendered. Before the fix it
            // fired here, before the container existed ("container not found").
            expect(embedCalled).toBe(false);

            that.$timeout.flush();

            expect(embedCalled).toBe(true);
            expect(vm.error).toBeUndefined();
        });
    });
});
