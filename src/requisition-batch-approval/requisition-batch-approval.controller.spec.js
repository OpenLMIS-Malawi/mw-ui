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

describe('RequisitionBatchApprovalController', function() {

    //injects
    var confirmDeferred, requisitionsStorage, batchRequisitionsStorage, notificationServiceSpy, batchDeferred;

    beforeEach(function() {
        module('requisition-batch-approval');
        module('requisition-view-tab');

        var requisitionWatcherMock = jasmine.createSpy('RequisitionWatcher');
        module(function($provide) {
            $provide.factory('RequisitionWatcher', function() {
                return function() {
                    this.enableWatcher = requisitionWatcherMock;
                };
            });

            requisitionsStorage = jasmine.createSpyObj('requisitionsStorage', ['search', 'put', 'getBy', 'removeBy']);
            batchRequisitionsStorage = jasmine.createSpyObj('batchRequisitionsStorage', ['search', 'put', 'getBy',
                'removeBy']);

            var offlineFlag = jasmine.createSpyObj('offlineRequisitions', ['getAll']);
            offlineFlag.getAll.andReturn([false]);
            var localStorageFactory = jasmine.createSpy('localStorageFactory').andCallFake(function(resourceName) {
                if (resourceName === 'offlineFlag') {
                    return offlineFlag;
                }
                if (resourceName === 'batchApproveRequisitions') {
                    return batchRequisitionsStorage;
                }
                return requisitionsStorage;
            });

            $provide.service('localStorageFactory', function() {
                return localStorageFactory;
            });
        });

        inject(function($injector) {
            this.$controller = $injector.get('$controller');
            this.confirmService = $injector.get('confirmService');
            this.$rootScope = $injector.get('$rootScope');
            this.$q = $injector.get('$q');
            this.$scope = $injector.get('$rootScope').$new();
            this.requisitionService = $injector.get('requisitionService');
            this.notificationService = $injector.get('notificationService');
            this.$stateParams = $injector.get('$stateParams');
            this.alertService = $injector.get('alertService');
            this.$state = $injector.get('$state');
            this.requisitionBatchSaveFactory = $injector.get('requisitionBatchSaveFactory');
            this.requisitionBatchApproveFactory = $injector.get('requisitionBatchApproveFactory');
            this.calculationFactory = $injector.get('calculationFactory');
            this.loadingModalService = $injector.get('loadingModalService');
            this.RequisitionDataBuilder = $injector.get('RequisitionDataBuilder');
            this.RequisitionLineItemDataBuilder = $injector.get('RequisitionLineItemDataBuilder');
            this.ProgramDataBuilder = $injector.get('ProgramDataBuilder');
            // MALAWISUP-7421: needed to assert the return to the approval list
            this.stateTrackerService = $injector.get('stateTrackerService');
            // MALAWISUP-7421: Ends here
        });

        this.program = new this.ProgramDataBuilder().build();

        this.requisition = new this.RequisitionDataBuilder()
            .withProgram(this.program)
            .withRequisitionLineItems([
                new this.RequisitionLineItemDataBuilder()
                    .fullSupplyForProgram(this.program)
                    .buildJson(),
                new this.RequisitionLineItemDataBuilder()
                    .nonFullSupplyForProgram(this.program)
                    .buildJson()
            ])
            .build();

        this.requisition.requisitionLineItems[0].id = 1;
        this.requisition.requisitionLineItems[0].totalCost = 100;
        this.requisition.requisitionLineItems[1].id = 2;
        this.requisition.requisitionLineItems[1].totalCost = 10;

        this.requisition.requisitionLineItems[0].approvedQuantity = 10;
        this.requisition.requisitionLineItems[1].approvedQuantity = 1;

        this.requisitions = [this.requisition];

        this.products = {};
        this.products[this.requisition.requisitionLineItems[0].orderable.id] = {
            code: this.requisition.requisitionLineItems[0].orderable.productCode,
            name: this.requisition.requisitionLineItems[0].orderable.fullProductName,
            totalCost: this.requisition.requisitionLineItems[0].totalCost,
            totalQuantity: this.requisition.requisitionLineItems[0].approvedQuantity,
            requisitions: [this.requisition.id],
            productId: this.requisition.requisitionLineItems[0].orderable.id
        };
        this.products[this.requisition.requisitionLineItems[1].orderable.id] = {
            code: this.requisition.requisitionLineItems[1].orderable.productCode,
            name: this.requisition.requisitionLineItems[1].orderable.fullProductName,
            totalCost: this.requisition.requisitionLineItems[1].totalCost,
            totalQuantity: this.requisition.requisitionLineItems[1].approvedQuantity,
            requisitions: [this.requisition.id],
            productId: this.requisition.requisitionLineItems[1].orderable.id
        };

        this.lineItems = [];
        this.lineItems[this.requisition.id] = [];
        this.lineItems[this.requisition.id][this.requisition.requisitionLineItems[0]
            .orderable.id] = this.requisition.requisitionLineItems[0];
        this.lineItems[this.requisition.id][this.requisition.requisitionLineItems[1]
            .orderable.id] = this.requisition.requisitionLineItems[1];

        this.$stateParams.errors = {};
        spyOn(this.requisitionService, 'get').andReturn(this.$q.when(this.requisition));

        this.initController = initController;
    });

    describe('$onInit', function() {

        beforeEach(function() {
            this.$stateParams.errors[this.requisitions[0].id] = 'There was an error';

            this.vm = this.$controller('RequisitionBatchApprovalController', {
                requisitions: this.requisitions,
                $scope: this.$scope,
                $stateParams: this.$stateParams
            });

            var context = this;
            spyOn(this.calculationFactory, 'totalCost').andCallFake(function(lineItem) {
                if (lineItem.id === 1) {
                    return context.requisitions[0].requisitionLineItems[0].totalCost;
                }
                if (lineItem.id === 2) {
                    return context.requisitions[0].requisitionLineItems[1].totalCost;
                }
                return null;
            });
        });

        it('should expose requisitions', function() {
            this.vm.$onInit();
            this.$rootScope.$apply();

            expect(this.vm.requisitions).toEqual(this.requisitions);
        });

        it('should assign errors to requisitions', function() {
            this.vm.$onInit();
            this.$rootScope.$apply();

            expect(this.vm.requisitions[0].$error).toEqual('There was an error');
        });

        it('should calculate total cost of requisition', function() {
            this.vm.$onInit();
            this.$rootScope.$apply();

            expect(this.vm.requisitions[0].$totalCost).toEqual(110);
        });

        it('should calculate total cost of all requisitions', function() {
            this.vm.$onInit();
            this.$rootScope.$apply();

            expect(this.vm.totalCost).toEqual(110);
        });

        it('should expose list of products', function() {
            this.vm.$onInit();
            this.$rootScope.$apply();

            expect(this.vm.products).toEqual(this.products);
        });

        it('should expose list of line items', function() {
            this.vm.$onInit();
            this.$rootScope.$apply();

            expect(this.vm.lineItems).toEqual(this.lineItems);
        });
    });

    describe('updateLineItem', function() {

        var requisitionId, orderableId;

        beforeEach(function() {
            this.initController();
            requisitionId = this.requisition.id;
            orderableId = this.requisition.requisitionLineItems[0].orderable.id;
            spyOn(this.calculationFactory, 'totalCost').andReturn(100);
        });

        it('should call calculation factory method', function() {
            this.vm.updateLineItem(this.lineItems[requisitionId][orderableId], this.requisitions[0]);

            expect(this.calculationFactory.totalCost).toHaveBeenCalled();
        });

        it('should change total cost value', function() {
            this.vm.updateLineItem(this.lineItems[requisitionId][orderableId], this.requisitions[0]);

            expect(this.lineItems[requisitionId][orderableId].totalCost).toBe(100);
        });
    });

    describe('revert', function() {

        beforeEach(function() {
            this.initController();

            confirmDeferred = this.$q.defer();
            spyOn(this.confirmService, 'confirm').andReturn(confirmDeferred.promise);
        });

        it('should ask user for confirmation', function() {
            this.vm.revert();

            confirmDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.confirmService.confirm).toHaveBeenCalledWith(
                'requisitionBatchApproval.revertConfirm', 'requisitionBatchApproval.revert'
            );
        });

        it('should revert requisitions to original state', function() {
            this.vm.requisitions[0].requisitionLineItems[0].approvedQuantity = 1000;

            this.vm.revert();
            confirmDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.vm.requisitions[0].requisitionLineItems[0].approvedQuantity).toBe(10);
            expect(this.vm.requisitions).toEqual(this.vm.requisitionsCopy);
        });

        it('should not revert requisitions if modal was dismissed', function() {
            this.vm.requisitions[0].requisitionLineItems[0].approvedQuantity = 1000;

            this.vm.revert();
            confirmDeferred.reject();
            this.$rootScope.$apply();

            expect(this.vm.requisitions[0].requisitionLineItems[0].approvedQuantity).toBe(1000);
        });
    });

    describe('updateRequisitions', function() {
        var isOffline;

        beforeEach(function() {
            isOffline = false;
            this.initController();

            spyOn(this.$state, 'reload');
            spyOn(this.alertService, 'error');

            spyOn(this.vm, 'isOffline').andCallFake(function() {
                return isOffline;
            });

            confirmDeferred = this.$q.defer();
            spyOn(this.confirmService, 'confirm').andReturn(confirmDeferred.promise);
        });

        it('should display alert if offline', function() {
            isOffline = true;
            this.vm.updateRequisitions();

            expect(this.alertService.error).toHaveBeenCalledWith('requisitionBatchApproval.updateOffline');
        });

        it('should ask user for confirmation to update', function() {
            this.vm.updateRequisitions();

            confirmDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.confirmService.confirm).toHaveBeenCalledWith(
                'requisitionBatchApproval.updateWarning', 'requisitionBatchApproval.update'
            );
        });

        it('should reload current state', function() {
            this.vm.updateRequisitions();

            confirmDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.$state.reload).toHaveBeenCalled();
        });

        it('should not reload current state if modal was dismissed', function() {
            this.vm.updateRequisitions();

            confirmDeferred.reject();
            this.$rootScope.$apply();

            expect(this.$state.reload).not.toHaveBeenCalled();
        });

        it('should clear local storage', function() {
            this.vm.updateRequisitions();

            confirmDeferred.resolve();
            this.$rootScope.$apply();

            expect(batchRequisitionsStorage.removeBy).toHaveBeenCalledWith('id', this.requisitions[0].id);
            expect(requisitionsStorage.removeBy).toHaveBeenCalledWith('id', this.requisitions[0].id);
        });

        it('should not clear local storage if modal was dismissed', function() {
            this.vm.updateRequisitions();

            confirmDeferred.reject();
            this.$rootScope.$apply();

            expect(batchRequisitionsStorage.removeBy).not.toHaveBeenCalled();
            expect(requisitionsStorage.removeBy).not.toHaveBeenCalled();
        });
    });

    describe('areRequisitionsOutdated', function() {

        beforeEach(function() {
            this.initController();
        });

        it('should return true if at least one requisition is marked as outdated', function() {
            this.vm.requisitions[0].$outdated = true;

            expect(this.vm.areRequisitionsOutdated()).toBeTruthy();
        });

        it('should return false if all requisitions are up to date', function() {
            expect(this.vm.areRequisitionsOutdated()).toBeFalsy();
        });

    });

    describe('sync', function() {

        beforeEach(function() {
            this.initController();

            confirmDeferred = this.$q.defer();
            notificationServiceSpy = jasmine.createSpy();

            spyOn(this.$state, 'go').andReturn();
            spyOn(this.requisitionBatchSaveFactory, 'saveRequisitions').andReturn(confirmDeferred.promise);
        });

        it('should show success notification if successfully save', function() {
            spyOn(this.notificationService, 'success').andCallFake(notificationServiceSpy);

            this.vm.sync();
            confirmDeferred.resolve(this.requisitions);
            this.$rootScope.$apply();

            expect(notificationServiceSpy).toHaveBeenCalledWith('requisitionBatchApproval.syncSuccess');
        });

        it('should show error notification if unsuccessfully save', function() {
            spyOn(this.notificationService, 'error').andCallFake(notificationServiceSpy);

            this.vm.sync();
            confirmDeferred.reject(this.requisitions);
            this.$rootScope.$apply();

            expect(notificationServiceSpy).toHaveBeenCalledWith('requisitionBatchApproval.syncError');
        });

        it('should reload current state', function() {
            this.vm.sync();
            confirmDeferred.reject(this.requisitions);
            this.$rootScope.$apply();

            expect(this.$state.go).toHaveBeenCalled();
        });
    });

    describe('approve', function() {

        beforeEach(function() {
            this.initController();

            confirmDeferred = this.$q.defer();
            batchDeferred = this.$q.defer();

            spyOn(this.$state, 'go').andReturn();
            spyOn(this.confirmService, 'confirm').andReturn(confirmDeferred.promise);
            spyOn(this.requisitionBatchApproveFactory, 'batchApprove').andReturn(batchDeferred.promise);
            spyOn(this.loadingModalService, 'close').andReturn();
        });

        it('should ask user for confirmation to approve', function() {
            this.vm.approve();

            confirmDeferred.resolve();
            batchDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.confirmService.confirm).toHaveBeenCalledWith('requisitionBatchApproval.approvalConfirm');
        });

        it('should close loading modal if an error occurs', function() {
            this.vm.approve();

            confirmDeferred.resolve();
            batchDeferred.reject();
            this.$rootScope.$apply();

            expect(this.loadingModalService.close).toHaveBeenCalled();
        });
    });

    // MALAWISUP-7421: Only let the user batch approve requisitions awaiting them at their approval level
    describe('$onInit when requisitions were filtered out', function() {

        beforeEach(function() {
            this.alertDeferred = this.$q.defer();

            spyOn(this.alertService, 'error').andReturn(this.alertDeferred.promise);
            spyOn(this.notificationService, 'error');
            spyOn(this.stateTrackerService, 'goToPreviousState');
            spyOn(this.calculationFactory, 'totalCost').andReturn(0);

            this.$stateParams.ids = this.requisitions[0].id + ',7b0b0c5a-0000-0000-0000-000000000001';

            this.initControllerWith = function(requisitions) {
                var vm = this.$controller('RequisitionBatchApprovalController', {
                    requisitions: requisitions,
                    calculationFactory: this.calculationFactory,
                    $scope: this.$scope,
                    $stateParams: this.$stateParams
                });

                vm.$onInit();

                return vm;
            };
        });

        it('should alert the user and return to the approval list if none are available', function() {
            var vm = this.initControllerWith([]);

            this.alertDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.alertService.error)
                .toHaveBeenCalledWith('requisitionBatchApproval.noRequisitionsAvailableForApproval');

            expect(this.stateTrackerService.goToPreviousState)
                .toHaveBeenCalledWith('openlmis.requisitions.approvalList');

            expect(vm.requisitions).toEqual([]);

            expect(vm.totalCost).toBe(0);
        });

        it('should return to the approval list even if the alert is dismissed', function() {
            this.initControllerWith([]);

            this.alertDeferred.reject();
            this.$rootScope.$apply();

            expect(this.stateTrackerService.goToPreviousState)
                .toHaveBeenCalledWith('openlmis.requisitions.approvalList');
        });

        it('should notify the user when only some of the requested requisitions are available', function() {
            var vm = this.initControllerWith(this.requisitions);

            this.$rootScope.$apply();

            expect(this.notificationService.error)
                .toHaveBeenCalledWith('requisitionBatchApproval.someRequisitionsNotAvailableForApproval');

            expect(vm.requisitions).toEqual(this.requisitions);
        });

        it('should not notify the user when all of the requested requisitions are available', function() {
            this.$stateParams.ids = this.requisitions[0].id;

            var vm = this.initControllerWith(this.requisitions);

            this.$rootScope.$apply();

            expect(this.notificationService.error).not.toHaveBeenCalled();

            expect(vm.requisitions).toEqual(this.requisitions);
        });
    });
    // MALAWISUP-7421: Ends here

    function initController() {
        this.vm = this.$controller('RequisitionBatchApprovalController', {
            requisitions: this.requisitions,
            calculationFactory: this.calculationFactory,
            $scope: this.$scope,
            $stateParams: this.$stateParams
        });
        this.vm.$onInit();
        this.$rootScope.$apply();
    }
});