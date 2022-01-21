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

describe('ValidSourceListController', function() {

    beforeEach(function() {

        this.validSources = [
            {
                programId: 1,
                facilityTypeId: 2,
                name: 'valid source 1',
                geoZoneId: 3,
                geoLevelId: 4
            },
            {
                programId: 0,
                facilityTypeId: 1,
                name: 'valid source 2',
                geoZoneId: 4,
                geoLevelId: 3
            }
        ];

        module('admin-valid-source-list');
        inject(function($injector) {
            this.$controller = $injector.get('$controller');
            this.$q = $injector.get('$q');
            this.$rootScope = $injector.get('$rootScope');
            this.notificationService = $injector.get('notificationService');
            this.$state = $injector.get('$state');
            this.confirmService = $injector.get('confirmService');
            this.loadingModalService = $injector.get('loadingModalService');
        });

        var geoLevelMap = [];
        geoLevelMap[4] = 'geo level 1';

        this.programs = ['program 1'];
        this.facilities = ['type 1'];

        this.controller = this.$controller('ValidSourceListController', {
            validSources: this.validSources,
            programsMap: {
                1: 'program 1'
            },
            facilityTypesMap: {
                2: 'type 1'
            },
            geographicZonesMap: {
                3: 'geo zone 1'
            },
            geographicLevelMap: geoLevelMap,
            programs: this.programs,
            facilities: this.facilities
        });

    });

    afterEach(function() {
        inject(function($injector) {
            var selected = this.controller.getSelected();
            for (var i = 0; i < selected.length; i++) {
                selected[i].$selected = false;
                this.controller.onValidSourceSelect(selected[i]);
            }

            $injector.get('$window').sessionStorage.clear();
        });
    });

    it('should assign facilities', function() {
        expect(this.controller.facilities).toEqual(this.facilities);
    });

    it('should assign programs', function() {
        expect(this.controller.programs).toEqual(this.programs);
    });

    it('should get all selected valid sources', function() {
        this.controller.validSources[0].$selected = true;

        var selectedValidSources = this.controller.getSelected();

        expect(selectedValidSources).toEqual([this.validSources[0]]);
    });

    it('should get an empty array if no valid source is selected', function() {
        var selectedValidSources = this.controller.getSelected();

        expect(selectedValidSources).toEqual([]);
    });

    describe('deleteSelectedValidSources', function() {
        var confirmDeferred, loadingDeferred;

        beforeEach(function() {
            confirmDeferred = this.$q.defer();
            loadingDeferred = this.$q.defer();

            spyOn(this.loadingModalService, 'open').andReturn(loadingDeferred.promise);
            spyOn(this.loadingModalService, 'close').andReturn();
            spyOn(this.confirmService, 'confirm').andReturn(confirmDeferred.promise);
            spyOn(this.notificationService, 'error').andReturn();
            spyOn(this.notificationService, 'success').andReturn();
        });

        it('should show error if no validSource is selected', function() {
            this.controller.deleteSelectedValidSources();

            expect(this.notificationService.error)
                .toHaveBeenCalledWith('adminValidSourceList.selectAtLeastOneValidSource');
        });

        it('should call confirmation modal', function() {
            this.controller.validSources[0].$selected = true;

            this.controller.deleteSelectedValidSources();
            confirmDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.confirmService.confirm)
                .toHaveBeenCalledWith('adminValidSourceList.delete.confirm', 'adminValidSourceList.delete');
        });

        it('should bring up loading modal if confirmation passed', function() {
            this.controller.validSources[0].$selected = true;

            this.controller.deleteSelectedValidSources();
            confirmDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.loadingModalService.open).toHaveBeenCalled();
        });

        it('should show error if delete failed', function() {
            this.controller.validSources[0].$selected = true;

            this.controller.deleteSelectedValidSources();
            confirmDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.notificationService.error)
                .toHaveBeenCalledWith('adminValidSourceList.failure');
        });

        it('should close loading modal if delete failed', function() {
            this.controller.validSources[0].$selected = true;

            this.controller.deleteSelectedValidSources();
            confirmDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.loadingModalService.close).toHaveBeenCalled();
        });

    });

    it('should select all valid sources', function() {
        this.controller.toggleSelectAll(true);

        expect(this.controller.validSources[0].$selected).toBe(true);
        expect(this.controller.validSources[1].$selected).toBe(true);
    });

    it('should deselect all valid sources', function() {
        this.controller.toggleSelectAll(false);

        expect(this.controller.validSources[0].$selected).toBe(false);
        expect(this.controller.validSources[1].$selected).toBe(false);
    });

    it('should set "select all" option when all valid sources are selected by user', function() {
        for (var i = 0; i < this.controller.validSources.length; i++) {
            this.controller.validSources[i].$selected = true;
            this.controller.onValidSourceSelect(this.controller.validSources[i]);
        }

        this.controller.setSelectAll();

        expect(this.controller.selectAll).toBe(true);
    });

    it('should not set "select all" option when not all valid sources are selected by user', function() {
        this.controller.validSources[0].$selected = true;
        this.controller.onValidSourceSelect(this.controller.validSources[0]);

        for (var i = 1; i < this.controller.validSources.length; i++) {
            this.controller.validSources[i].$selected = false;
            this.controller.onValidSourceSelect(this.controller.validSources[i]);
        }

        this.controller.setSelectAll();

        expect(this.controller.selectAll).toBe(false);
    });
});