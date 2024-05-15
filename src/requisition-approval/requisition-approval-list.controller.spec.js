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

describe('RequisitionApprovalListController', function() {

    //injects
    var vm, $state, alertService, $controller, requisitionsStorage, batchRequisitionsStorage, initiateRequisitionStorage;

    //variables
    var requisitions, programs;

    beforeEach(function() {
        module('requisition-approval');

        module(function($provide) {
            requisitionsStorage = jasmine.createSpyObj('requisitionsStorage', ['search', 'put', 'getBy', 'removeBy']);
            batchRequisitionsStorage = jasmine.createSpyObj('batchRequisitionsStorage', ['search', 'put', 'getBy',
                'removeBy']);
            initiateRequisitionStorage = jasmine.createSpyObj('stateStorage', ['put', 'clearAll', 'getAll']);

            var offlineFlag = jasmine.createSpyObj('offlineRequisitions', ['getAll']);
            offlineFlag.getAll.andReturn([false]);
            var localStorageFactorySpy = jasmine.createSpy('localStorageFactory').andCallFake(function(resourceName) {
                if (resourceName === 'offlineFlag') {
                    return offlineFlag;
                }
                if (resourceName === 'batchApproveRequisitions') {
                    return batchRequisitionsStorage;
                }
                if (resourceName === 'initiateRequisitionData') {
                    return initiateRequisitionStorage;
                }
                return requisitionsStorage;
            });

            $provide.service('localStorageFactory', function() {
                return localStorageFactorySpy;
            });
        });

        inject(function($injector) {

            $controller = $injector.get('$controller');
            $state = $injector.get('$state');
            alertService = $injector.get('alertService');
        });

        programs = [{
            id: '1',
            code: 'PRG001',
            name: 'Family Planning'
        },
            {
                id: '2',
                code: 'PRG002',
                name: 'Essential Meds'
            }];

        requisitions = [
            {
                id: 1,
                facility: {
                    id: '1',
                    name: 'first facility',
                    code: 'first code'
                },
                program: programs[0]

            },
            {
                id: 2,
                facility: {
                    id: '2',
                    name: 'second facility',
                    code: 'second code'
                },
                program: programs[1]

            }
        ];
    });

    describe('$onInit', function() {

        beforeEach(function() {
            initController();
        });

        it('should expose requisitions', function() {
            vm.$onInit();

            expect(vm.requisitions).toBe(requisitions);
        });

        it('should expose programs', function() {
            vm.$onInit();

            expect(vm.programs).toBe(programs);
        });

        it('should expose selected program', function() {
            vm.$onInit();

            expect(vm.selectedProgram).toBe(programs[0]);
        });

        it('should expose offline flag', function() {
            vm.$onInit();

            expect(vm.offline).toBe(false);
        });

        it('should expose isBatchApproveScreenActive flag', function() {
            vm.$onInit();

            expect(vm.isBatchApproveScreenActive).toBe(true);
        });

        it('should expose sort options', function() {
            expect(vm.options).toEqual({
                'requisitionApproval.newestAuthorized': ['emergency,desc', 'authorizedDate,desc'],
                'requisitionApproval.oldestAuthorized': ['emergency,desc', 'authorizedDate,asc']
            });
        });
    });

    describe('search', function() {

        beforeEach(function() {
            initController();

            spyOn($state, 'go');
        });

        it('should set program', function() {
            vm.selectedProgram = programs[0];

            vm.search();

            expect($state.go).toHaveBeenCalledWith('openlmis.requisitions.approvalList', {
                program: vm.selectedProgram.id,
                offline: false
            }, {
                reload: true
            });
        });

        it('should set offline flag correctly', function() {
            vm.selectedProgram = programs[0];
            vm.offline = true;

            vm.search();

            expect($state.go).toHaveBeenCalledWith('openlmis.requisitions.approvalList', {
                program: vm.selectedProgram.id,
                offline: true
            }, {
                reload: true
            });
        });

        it('should reload state', function() {
            vm.search();

            expect($state.go).toHaveBeenCalled();
        });
    });

    describe('openRnr', function() {

        beforeEach(function() {
            initController();

            spyOn($state, 'go');
        });

        it('should go to fullSupply state', function() {
            vm.openRnr(requisitions[0].id);

            expect($state.go).toHaveBeenCalledWith('openlmis.requisitions.requisition.fullSupply', {
                rnr: requisitions[0].id
            });
        });
    });

    describe('viewSelectedRequisitions', function() {

        beforeEach(function() {
            initController();

            spyOn($state, 'go');
            spyOn(alertService, 'error');
        });

        it('should show error when trying to call with no requisition selected', function() {
            vm.viewSelectedRequisitions();

            expect($state.go).not.toHaveBeenCalled();
            expect(alertService.error).toHaveBeenCalledWith('requisitionApproval.selectAtLeastOneRnr');
        });

        it('should show error when trying to call with requisition selected from two different programs', function() {
            vm.selectedProgram = undefined;
            vm.requisitions[0].$selected = true;
            vm.requisitions[1].$selected = true;

            vm.viewSelectedRequisitions();

            expect($state.go).not.toHaveBeenCalled();
            expect(alertService.error).toHaveBeenCalledWith('requisitionApproval.selectRequisitionsFromTheSameProgram');
        });

        it('should not show error when trying to call with requisition selected', function() {
            vm.requisitions[0].$selected = true;

            vm.viewSelectedRequisitions();

            expect($state.go).toHaveBeenCalledWith('openlmis.requisitions.batchApproval', {
                ids: [ vm.requisitions[0].id ].join(',')
            });

            expect(alertService.error).not.toHaveBeenCalled();
        });

    });

    function initController() {
        vm = $controller('RequisitionApprovalListController', {
            requisitions: requisitions,
            programs: programs,
            selectedProgram: programs[0],
            isBatchApproveScreenActive: true
        });
        vm.$onInit();
    }
});