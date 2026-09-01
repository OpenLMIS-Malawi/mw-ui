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

describe('OpenlmisHomePageReportController', function() {

    var SUPERSET_URL = 'http://localhost/superset';
    var EMBEDDED_UUID = 'embedded-uuid-1234';

    beforeEach(function() {
        module('openlmis-home-page-report', function($provide) {
            $provide.constant('SUPERSET_URL', SUPERSET_URL);
        });

        inject(function($injector) {
            this.$controller = $injector.get('$controller');
            this.$rootScope = $injector.get('$rootScope');
            this.$q = $injector.get('$q');
            this.$sce = $injector.get('$sce');
            this.$httpBackend = $injector.get('$httpBackend');
            this.offlineService = $injector.get('offlineService');
            this.supersetOAuthService = $injector.get('supersetOAuthService');
            this.reportDashboardService = $injector.get('reportDashboardService');
            this.messageService = $injector.get('messageService');
            this.openlmisUrlFactory = $injector.get('openlmisUrlFactory');
            this.REPORT_TYPES = $injector.get('REPORT_TYPES');
        });

        this.$scope = this.$rootScope.$new();
        this.getHomePageReportDeferred = this.$q.defer();

        spyOn(this.reportDashboardService, 'getHomePageReport')
            .andReturn(this.getHomePageReportDeferred.promise);
        spyOn(this.offlineService, 'isOffline').andReturn(false);
        spyOn(this.supersetOAuthService, 'checkAuthorizationInSuperset')
            .andReturn(this.$q.resolve({
                state: 'oauth-state',
                isAuthorized: true
            }));
        spyOn(this.messageService, 'get').andCallFake(function(key) {
            return key;
        });
        spyOn(this.$sce, 'trustAsResourceUrl').andCallFake(function(url) {
            return url;
        });

        this.container = document.createElement('div');
        this.$element = [{
            querySelector: function() {
                return this.container;
            }.bind(this)
        }];

        // The Embedded SDK is a browser global; save and restore it around each test.
        this.savedSdk = window.supersetEmbeddedSdk;
        window.supersetEmbeddedSdk = undefined;

        this.initController = function() {
            this.vm = this.$controller('OpenlmisHomePageReportController', {
                $scope: this.$scope,
                $element: this.$element
            });
            this.vm.$onInit();
        };

        // Boots the controller and resolves the home page report request.
        this.run = function(report) {
            this.initController();
            this.getHomePageReportDeferred.resolve({
                content: report ? [report] : []
            });
            this.$rootScope.$apply();
        };
    });

    afterEach(function() {
        window.supersetEmbeddedSdk = this.savedSdk;
    });

    describe('when there is no home page report', function() {

        beforeEach(function() {
            this.run(null);
        });

        it('should not set the report', function() {
            expect(this.vm.report).toBeUndefined();
        });

        it('should neither authorize nor embed', function() {
            expect(this.vm.isAuthorized).toBe(false);
            expect(this.vm.isEmbedded).toBe(false);
        });
    });

    describe('for a non-Superset report', function() {

        beforeEach(function() {
            this.run({
                type: this.REPORT_TYPES.POWERBI,
                url: 'http://example.com/report'
            });
        });

        it('should authorize the legacy iframe', function() {
            expect(this.vm.isAuthorized).toBe(true);
        });

        it('should not use the embedded SDK', function() {
            expect(this.vm.isEmbedded).toBe(false);
        });

        it('should trust the report URL', function() {
            expect(this.$sce.trustAsResourceUrl).toHaveBeenCalledWith('http://example.com/report');
        });

        it('should not check Superset authorization', function() {
            expect(this.supersetOAuthService.checkAuthorizationInSuperset).not.toHaveBeenCalled();
        });
    });

    describe('for a Superset report without an embedded UUID', function() {

        it('should authorize via the OAuth flow when granted and online', function() {
            this.run({
                type: this.REPORT_TYPES.SUPERSET,
                url: 'http://superset/dashboard'
            });

            expect(this.supersetOAuthService.checkAuthorizationInSuperset).toHaveBeenCalled();
            expect(this.vm.isAuthorized).toBe(true);
            expect(this.vm.isEmbedded).toBe(false);
        });

        it('should not check authorization when offline', function() {
            this.offlineService.isOffline.andReturn(true);

            this.run({
                type: this.REPORT_TYPES.SUPERSET,
                url: 'http://superset/dashboard'
            });

            expect(this.supersetOAuthService.checkAuthorizationInSuperset).not.toHaveBeenCalled();
            expect(this.vm.isAuthorized).toBe(false);
        });
    });

    describe('for a Superset report with an embedded UUID', function() {

        var report;

        beforeEach(function() {
            report = {
                type: this.REPORT_TYPES.SUPERSET,
                embeddedUuid: EMBEDDED_UUID,
                url: null
            };
        });

        it('should flag the report as embedded', function() {
            this.run(report);

            expect(this.vm.isEmbedded).toBe(true);
        });

        it('should not embed nor make requests when offline', function() {
            this.offlineService.isOffline.andReturn(true);

            this.run(report);

            expect(this.vm.isEmbedded).toBe(true);
            expect(this.vm.isReady).toBe(false);
            this.$httpBackend.verifyNoOutstandingRequest();
        });

        describe('when the SDK is already cached', function() {

            beforeEach(function() {
                this.embedDashboardSpy = jasmine.createSpy('embedDashboard')
                    .andReturn(this.$q.resolve());
                window.supersetEmbeddedSdk = {
                    embedDashboard: this.embedDashboardSpy
                };
            });

            it('should embed the dashboard and become ready without error', function() {
                this.run(report);

                expect(this.embedDashboardSpy).toHaveBeenCalled();
                expect(this.vm.isReady).toBe(true);
                expect(this.vm.error).toBeUndefined();
            });

            it('should pass the embedded UUID, domain and mount point to the SDK', function() {
                this.run(report);

                var config = this.embedDashboardSpy.mostRecentCall.args[0];

                expect(config.id).toEqual(EMBEDDED_UUID);
                expect(config.supersetDomain).toEqual(SUPERSET_URL);
                expect(config.mountPoint).toBe(this.container);
            });

            it('should fetch a guest token from the OpenLMIS endpoint', function() {
                this.run(report);

                var config = this.embedDashboardSpy.mostRecentCall.args[0];
                var guestTokenUrl = this.openlmisUrlFactory(
                    '/api/reports/superset/guest-token?embeddedUuid=' + EMBEDDED_UUID
                );
                this.$httpBackend.expectGET(guestTokenUrl).respond(200, {
                    token: 'guest-token-abc'
                });

                var resolvedToken;
                config.fetchGuestToken().then(function(token) {
                    resolvedToken = token;
                });
                this.$httpBackend.flush();

                expect(resolvedToken).toEqual('guest-token-abc');
            });

            it('should set an error when the mount container is missing', function() {
                this.container = null;

                this.run(report);

                expect(this.vm.error).toEqual('openlmisHomePageReport.embed.containerNotFound');
                expect(this.vm.isReady).toBe(false);
            });

            it('should set an error when embedding fails', function() {
                this.embedDashboardSpy.andReturn(this.$q.reject({
                    message: 'boom'
                }));

                this.run(report);

                expect(this.vm.error).toContain('openlmisHomePageReport.embed.failed');
            });
        });

        describe('when the SDK must be loaded', function() {

            var sdkUrl;

            beforeEach(function() {
                sdkUrl = SUPERSET_URL + '/static/superset-embedded-sdk.js';
            });

            afterEach(function() {
                this.$httpBackend.verifyNoOutstandingExpectation();
                this.$httpBackend.verifyNoOutstandingRequest();
            });

            it('should load the SDK via $http and expose it on window', function() {
                var scriptBody = 'window.supersetEmbeddedSdk = {' +
                    ' embedDashboard: function() { return Promise.resolve(); } };';
                this.$httpBackend.expectGET(sdkUrl).respond(200, scriptBody);

                this.run(report);
                this.$httpBackend.flush();
                this.$rootScope.$digest();

                expect(window.supersetEmbeddedSdk).toBeDefined();
                expect(window.supersetEmbeddedSdk.embedDashboard).toBeDefined();
            });

            it('should set an error when the SDK fails to load', function() {
                this.$httpBackend.expectGET(sdkUrl).respond(500, 'Server Error');

                this.run(report);
                this.$httpBackend.flush();
                this.$rootScope.$digest();

                expect(this.vm.error).toContain('openlmisHomePageReport.sdk.failed');
            });
        });
    });
});
