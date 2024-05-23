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

describe('RequisitionSearchController', function() {

    beforeEach(function() {

        module('requisition-search');
        module('requisition-view-tab');
        module('requisition-view');

        inject(function($injector) {
            this.$q = $injector.get('$q');
            this.$rootScope = $injector.get('$rootScope');
            this.$controller = $injector.get('$controller');
            this.$stateParams = $injector.get('$stateParams');
            this.$state = $injector.get('$state');
            this.offlineService = $injector.get('offlineService');
            this.confirmService = $injector.get('confirmService');
            this.REQUISITION_STATUS = $injector.get('REQUISITION_STATUS');
            this.RequisitionDataBuilder = $injector.get('RequisitionDataBuilder');
        });

        this.requistion = new this.RequisitionDataBuilder();

        this.facilities = [{
            name: 'facilityOne',
            id: 'facility-one'
        }, {
            name: 'facilityTwo',
            id: 'facility-two',
            supportedPrograms: [{
                name: 'programOne',
                id: 'program-one'
            }, {
                name: 'programTwo',
                id: 'program-two'
            }]
        }];

        this.items = [
            'itemOne', 'itemTwo'
        ];
    });

    describe('$onInit', function() {

        var $controllerMock;

        beforeEach(function() {
            $controllerMock = jasmine.createSpy('$controller').andCallFake(function() {
                this.vm.stateParams = {};
            });

            this.vm = this.$controller('RequisitionSearchController', {
                requisitions: this.items,
                facilities: this.facilities,
                $controller: $controllerMock
            });

        });

        it('should expose facilities', function() {
            this.vm.$onInit();

            expect(this.vm.facilities).toBe(this.facilities);
        });

        it('should expose statuses', function() {
            this.vm.$onInit();

            expect(this.vm.statuses).toEqual(this.REQUISITION_STATUS.$toList());
        });

        it('should set searchOffline to true if true was passed through state parameters', function() {
            this.$stateParams.offline = 'true';

            this.vm.$onInit();

            expect(this.vm.offline).toEqual(true);
        });

        it('should set searchOffline to true if application is in offline mode', function() {
            spyOn(this.offlineService, 'isOffline').andReturn(true);

            this.vm.$onInit();

            expect(this.vm.offline).toEqual(true);
        });

        it('should set searchOffline to false if false was passed the URL and application is not in offline mode',
            function() {
                this.$stateParams.offline = 'false';
                spyOn(this.offlineService, 'isOffline').andReturn(false);

                this.vm.$onInit();

                expect(this.vm.offline).toEqual(false);
            });

        it('should set selectedFacility if facility ID was passed the URL', function() {
            this.$stateParams.facility = 'facility-two';

            this.vm.$onInit();

            expect(this.vm.selectedFacility).toBe(this.facilities[1]);
        });

        it('should not set selectedFacility if facility ID was not passed through the URL', function() {
            this.$stateParams.facility = undefined;

            this.vm.$onInit();

            expect(this.vm.selectedFacility).toBeUndefined();
        });

        it('should set selectedProgram if program and facility ID were passed through the URL', function() {
            this.$stateParams.facility = 'facility-two';
            this.$stateParams.program = 'program-two';

            this.vm.$onInit();

            expect(this.vm.selectedProgram).toBe(this.facilities[1].supportedPrograms[1]);
        });

        it('should not set selectedProgram if facility ID was not passed through the URL', function() {
            this.$stateParams.facility = undefined;

            this.vm.$onInit();

            expect(this.vm.selectedProgram).toBeUndefined();
        });

        it('should not set selected program if program ID was not passed through the URL', function() {
            this.$stateParams.facility = 'facility-two';
            this.$stateParams.program = undefined;

            this.vm.$onInit();

            expect(this.vm.selectedProgram).toBeUndefined();
        });

        it('should set startDate if initiated date from was passed through the URL', function() {
            this.$stateParams.initiatedDateFrom = '2017-01-31';

            this.vm.$onInit();

            expect(this.vm.startDate).toEqual('2017-01-31');
        });

        it('should not set starDate if initiated date from not passed through the URL', function() {
            this.$stateParams.initiatedDateFrom = undefined;

            this.vm.$onInit();

            expect(this.vm.starDate).toBeUndefined();
        });

        it('should set status if it was passed through the URL', function() {
            this.$stateParams.requisitionStatus = 'SUBMITTED';

            this.vm.$onInit();

            expect(this.vm.selectedStatus).toEqual('SUBMITTED');
        });

        it('should not set status if not passed through the URL', function() {
            this.$stateParams.requisitionStatus = undefined;

            this.vm.$onInit();

            expect(this.vm.selectedStatus).toBeUndefined();
        });

        it('should set endDate if initiated date to was passed through the URL', function() {
            this.$stateParams.initiatedDateTo = '2017-01-31';

            this.vm.$onInit();

            expect(this.vm.endDate).toEqual('2017-01-31');
        });

        it('should not set endDate if initiated date to not passed through the URL', function() {
            this.$stateParams.initiatedDateTo = undefined;

            this.vm.$onInit();

            expect(this.vm.endDate).toBeUndefined();
        });

        it('should expose sort options', function() {
            expect(this.vm.options).toEqual({
                'requisitionSearch.dateInitiated': ['createdDate,desc']
            });
        });
    });

    describe('search', function() {

        beforeEach(function() {
            initController(this);
            this.vm.$onInit();

            spyOn(this.$state, 'go').andReturn();
        });

        it('should set program', function() {
            this.vm.selectedProgram = {
                name: 'programOne',
                id: 'program-one'
            };

            this.vm.search();

            expect(this.$state.go).toHaveBeenCalledWith('openlmis.requisitions.search', {
                program: this.vm.selectedProgram.id,
                facility: null,
                initiatedDateFrom: null,
                initiatedDateTo: null,
                offline: false
            }, {
                reload: true
            });
        });

        it('should set facility', function() {
            this.vm.selectedFacility = {
                name: 'facilityOne',
                id: 'facility-one'
            };

            this.vm.search();

            expect(this.$state.go).toHaveBeenCalledWith('openlmis.requisitions.search', {
                program: null,
                facility: this.vm.selectedFacility.id,
                initiatedDateFrom: null,
                initiatedDateTo: null,
                offline: false
            }, {
                reload: true
            });
        });

        it('should set initiatedDateFrom', function() {
            this.vm.startDate = new Date('2017-01-31T23:00:00.000Z');

            this.vm.search();

            expect(this.$state.go).toHaveBeenCalledWith('openlmis.requisitions.search', {
                program: null,
                facility: null,
                initiatedDateFrom: '2017-01-31',
                initiatedDateTo: null,
                offline: false
            }, {
                reload: true
            });
        });

        it('should set initiatedDateTo', function() {
            this.vm.endDate = new Date('2017-01-31T23:00:00.000Z');

            this.vm.search();

            expect(this.$state.go).toHaveBeenCalledWith('openlmis.requisitions.search', {
                program: null,
                facility: null,
                initiatedDateFrom: null,
                initiatedDateTo: '2017-01-31',
                offline: false
            }, {
                reload: true
            });
        });

        it('should set offline', function() {
            this.vm.offline = true;

            this.vm.search();

            expect(this.vm.offline).toBe(true);
        });

        it('should reload state', function() {
            this.vm.search();

            expect(this.$state.go).toHaveBeenCalled();
        });

    });

    describe('openRnr', function() {

        beforeEach(function() {
            initController(this);
        });

        it('should go to requisitions.requisition.fullSupply state', function() {
            spyOn(this.$state, 'go').andReturn();

            this.vm.openRnr(this.requistion);

            expect(this.$state.go).toHaveBeenCalledWith('openlmis.requisitions.requisition.fullSupply', {
                rnr: this.requistion
            });
        });

    });

    describe('removeOfflineRequisition', function() {

        var requisition, confirmDeferred, localStorageFactoryMock, offlineRequisitionsMock;

        beforeEach(function() {
            offlineRequisitionsMock = jasmine.createSpyObj('offlineRequisitions', ['removeBy']);
            localStorageFactoryMock = jasmine.createSpy('localStorageFactory');

            localStorageFactoryMock.andReturn(offlineRequisitionsMock);

            this.vm = this.$controller('RequisitionSearchController', {
                requisitions: this.items,
                facilities: this.facilities,
                localStorageFactory: localStorageFactoryMock
            });

            requisition = {
                id: 'requisition-id'
            };

            confirmDeferred = this.$q.defer();

            spyOn(this.confirmService, 'confirmDestroy').andReturn(confirmDeferred.promise);
        });

        it('should require confirmation', function() {
            this.vm.removeOfflineRequisition(requisition);

            expect(this.confirmService.confirmDestroy).toHaveBeenCalled();
        });

        it('should remove requisition after confirmation', function() {
            this.vm.removeOfflineRequisition(requisition);
            confirmDeferred.resolve();
            this.$rootScope.$apply();

            expect(offlineRequisitionsMock.removeBy).toHaveBeenCalledWith('id', requisition.id);
            expect(requisition.$availableOffline).toBe(false);
        });

        it('should not remove requisition without confirmation', function() {
            this.vm.removeOfflineRequisition(requisition);
            confirmDeferred.reject();
            this.$rootScope.$apply();

            expect(offlineRequisitionsMock.removeBy).not.toHaveBeenCalled();
            expect(requisition.$availableOffline).not.toBe(false);
        });

    });

    describe('isOfflineDisabled', function() {

        beforeEach(function() {
            initController(this);
        });

        it('should return true if application is offline', function() {
            spyOn(this.offlineService, 'isOffline').andReturn(true);

            var result = this.vm.isOfflineDisabled();

            expect(result).toBe(true);
        });

        it('should set searchOffline to true if application goes in the offline mode', function() {
            spyOn(this.offlineService, 'isOffline').andReturn(true);

            this.vm.isOfflineDisabled();

            expect(this.vm.offline).toBe(true);
        });

        it('should return false if application is online', function() {
            spyOn(this.offlineService, 'isOffline').andReturn(false);

            var result = this.vm.isOfflineDisabled();

            expect(result).toBe(false);
        });

        it('should not change searchOffline if application is online', function() {
            spyOn(this.offlineService, 'isOffline').andReturn(false);
            this.vm.offline = false;

            this.vm.isOfflineDisabled();

            expect(this.vm.offline).toBe(false);

            this.vm.offline = true;

            this.vm.isOfflineDisabled();

            expect(this.vm.offline).toBe(true);
        });

    });

    function initController(test) {
        test.vm = test.$controller('RequisitionSearchController', {
            requisitions: test.items,
            facilities: test.facilities
        });
        test.vm.$onInit();
    }

});
