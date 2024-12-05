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

describe('facilityProgramCacheService', function() {

    beforeEach(function() {
        module('openlmis-facility-program-select');

        inject(function($injector) {
            this.$q = $injector.get('$q');
            this.$rootScope = $injector.get('$rootScope');
            this.facilityProgramCacheService = $injector.get('facilityProgramCacheService');
            this.authorizationService = $injector.get('authorizationService');
            this.programService = $injector.get('programService');
            this.facilityService = $injector.get('facilityService');
            this.permissionService = $injector.get('permissionService');
            this.currentUserService = $injector.get('currentUserService');
            this.UserDataBuilder = $injector.get('UserDataBuilder');
            this.ProgramDataBuilder = $injector.get('ProgramDataBuilder');
            this.FacilityDataBuilder = $injector.get('FacilityDataBuilder');
            this.PermissionDataBuilder = $injector.get('PermissionDataBuilder');
        });

        this.facilities = [
            new this.FacilityDataBuilder().build(),
            new this.FacilityDataBuilder().build()
        ];

        this.programs = [
            new this.ProgramDataBuilder().build(),
            new this.ProgramDataBuilder().build(),
            new this.ProgramDataBuilder().build()
        ];

        this.user = new this.UserDataBuilder().buildAuthUserJson();

        this.referencedataUser = new this.UserDataBuilder()
            .withHomeFacilityId(this.facilities[0].id)
            .build();

        var permissions = [
            new this.PermissionDataBuilder()
                .withRight('right-1')
                .withProgramId(this.programs[0].id)
                .withFacilityId(this.facilities[0].id)
                .build(),
            new this.PermissionDataBuilder()
                .withRight('right-1')
                .withProgramId(this.programs[1].id)
                .withFacilityId(this.facilities[1].id)
                .build(),
            new this.PermissionDataBuilder()
                .withRight('right-1')
                .withProgramId(this.programs[2].id)
                .withFacilityId(this.facilities[1].id)
                .build(),
            new this.PermissionDataBuilder()
                .withRight('right-2')
                .withProgramId(this.programs[1].id)
                .withFacilityId(this.facilities[0].id)
                .build()
        ];

        spyOn(this.authorizationService, 'getUser').andReturn(this.user);
        spyOn(this.programService, 'getUserPrograms').andReturn(this.$q.when(this.programs));
        spyOn(this.facilityService, 'getAllMinimal').andReturn(this.$q.when(this.facilities));
        spyOn(this.permissionService, 'load').andReturn(this.$q.when(permissions));
        spyOn(this.currentUserService, 'getUserInfo').andReturn(this.$q.when(this.referencedataUser));

        this.facilityProgramCacheService.pushRightsForModule('module', ['right-1']);
        this.loadPromise = this.facilityProgramCacheService.loadData('module');
        this.$rootScope.$apply();
    });

    describe('load', function() {

        it('should return promise', function() {
            expect(this.loadPromise.then).not.toBe(undefined);
        });

        it('should call facilityService', function() {
            expect(this.facilityService.getAllMinimal).toHaveBeenCalled();
        });

        it('should call authorizationService', function() {
            expect(this.authorizationService.getUser).toHaveBeenCalled();
        });

        it('should call programService', function() {
            expect(this.programService.getUserPrograms).toHaveBeenCalledWith(this.user.user_id);
        });

        it('should call permissionService', function() {
            expect(this.permissionService.load).toHaveBeenCalledWith(this.user.user_id);
        });

        it('should call currentUserService', function() {
            expect(this.currentUserService.getUserInfo).toHaveBeenCalled();
        });

        it('should reject promise if request fails', function() {
            this.currentUserService.getUserInfo.andReturn(this.$q.reject());

            var rejected;
            this.facilityProgramCacheService.loadData()
                .catch(function() {
                    rejected = true;
                });
            this.$rootScope.$apply();

            expect(this.currentUserService.getUserInfo).toHaveBeenCalled();
            expect(rejected).toEqual(true);
        });
    });

    describe('getUserHomeFacility', function() {

        it('should return home facility', function() {
            expect(this.facilityProgramCacheService.getUserHomeFacility()).toEqual(this.facilities[0]);
        });
    });

    describe('getUserPrograms', function() {

        it('should return supervised programs if isSupervised is true', function() {
            expect(this.facilityProgramCacheService.getUserPrograms(true).length).toEqual(2);
            expect(this.facilityProgramCacheService.getUserPrograms(true)).toContain(this.programs[1]);
            expect(this.facilityProgramCacheService.getUserPrograms(true)).toContain(this.programs[2]);
        });

        it('should return home facility programs if isSupervised is false', function() {
            expect(this.facilityProgramCacheService.getUserPrograms(false)).toEqual([this.programs[0]]);
        });

        it('should return supervised programs if isSupervised is true and user does not have a home facility',
            function() {
                this.referencedataUser.homeFacilityId = null;
                this.loadPromise = this.facilityProgramCacheService.loadData('module');
                this.$rootScope.$apply();

                expect(this.facilityProgramCacheService.getUserPrograms(true)).toEqual(this.programs);
            });

        it('should return an empty list if isSupervised is false and user does not have a home facility', function() {
            this.referencedataUser.homeFacilityId = null;
            this.loadPromise = this.facilityProgramCacheService.loadData('module');
            this.$rootScope.$apply();

            expect(this.facilityProgramCacheService.getUserPrograms(false)).toEqual([]);
        });
    });

    describe('getSupervisedFacilities', function() {

        beforeEach(function() {
            this.facilityProgramCacheService.pushRightsForModule('module', ['right-1']);
            this.facilityProgramCacheService.pushRightsForModule('module-2', ['right-1', 'right-2']);

            this.loadPromise = this.facilityProgramCacheService.loadData('module');
            this.$rootScope.$apply();
        });

        it('should return filtered facilities', function() {
            expect(this.facilityProgramCacheService.getSupervisedFacilities(this.programs[0].id))
                .toEqual([this.facilities[0]]);

            expect(this.facilityProgramCacheService.getSupervisedFacilities(this.programs[1].id))
                .toEqual([this.facilities[1]]);
        });
    });
});
