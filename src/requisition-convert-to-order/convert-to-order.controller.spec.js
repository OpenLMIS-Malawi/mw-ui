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

describe('ConvertToOrderController', function() {

    var UuidGenerator, ProgramDataBuilder, FacilityDataBuilder;

    beforeEach(function() {
        module('requisition-convert-to-order');

        inject(function($injector) {
            this.$q = $injector.get('$q');
            this.$rootScope = $injector.get('$rootScope');
            this.requisitionService = $injector.get('requisitionService');
            this.notificationService = $injector.get('notificationService');
            this.$state = $injector.get('$state');
            this.confirmService = $injector.get('confirmService');
            this.loadingModalService = $injector.get('loadingModalService');

            UuidGenerator = $injector.get('UuidGenerator');
            ProgramDataBuilder = $injector.get('ProgramDataBuilder');
            FacilityDataBuilder = $injector.get('FacilityDataBuilder');

            this.key = 'key';
            spyOn(UuidGenerator.prototype, 'generate').andCallFake(function() {
                return 'key';
            });

            this.stateParams = {
                programId: 'program-id',
                facilityId: 'facility-id',
                page: 0,
                size: 10
            };
            this.supplyingDepots = [
                new FacilityDataBuilder().build(),
                new FacilityDataBuilder().build()
            ];
            this.facilities = [
                new FacilityDataBuilder().build(),
                new FacilityDataBuilder().build()
            ];
            this.programs = [
                new ProgramDataBuilder().build(),
                new ProgramDataBuilder().build()
            ];
            this.requisitions = [
                {
                    requisition: {
                        id: 'requisitionId1',
                        facility: new FacilityDataBuilder().build(),
                        program: new ProgramDataBuilder().build()
                    },
                    supplyingDepots: this.supplyingDepots
                },
                {
                    requisition: {
                        id: 'requisitonId2',
                        facility: new FacilityDataBuilder().build(),
                        program: new ProgramDataBuilder().build()
                    },
                    supplyingDepots: this.supplyingDepots
                }
            ];

            var window = $injector.get('$window');

            this.vm = $injector.get('$controller')('ConvertToOrderController', {
                requisitions: this.requisitions,
                $stateParams: this.stateParams,
                facilities: this.facilities,
                programs: this.programs,
                $window: window
            });
        });
    });

    afterEach(function() {
        inject(function($injector) {
            var selected = this.vm.getSelected();
            for (var i = 0; i < selected.length; i++) {
                selected[i].$selected = false;
                this.vm.onRequisitionSelect(selected[i]);
            }

            $injector.get('$window').sessionStorage.clear();
        });
    });

    it('should assign facilities', function() {
        expect(this.vm.facilities).toEqual(this.facilities);
    });

    it('should assign programs', function() {
        expect(this.vm.programs).toEqual(this.programs);
    });

    it('should get all selected requisitions', function() {
        this.vm.requisitions[0].$selected = true;

        var selectedRequisitions = this.vm.getSelected();

        expect(selectedRequisitions).toEqual([this.requisitions[0]]);
    });

    it('should get an empty array if no requisition is selected', function() {
        var selectedRequisitions = this.vm.getSelected();

        expect(selectedRequisitions).toEqual([]);
    });

    describe('convertToOrder', function() {
        var confirmDeferred, convertDeferred, loadingDeferred;

        beforeEach(function() {
            confirmDeferred = this.$q.defer();
            convertDeferred = this.$q.defer();
            loadingDeferred = this.$q.defer();

            spyOn(this.loadingModalService, 'open').andReturn(loadingDeferred.promise);
            spyOn(this.loadingModalService, 'close').andReturn();
            spyOn(this.confirmService, 'confirm').andReturn(confirmDeferred.promise);
            spyOn(this.requisitionService, 'convertToOrder').andReturn(convertDeferred.promise);
            spyOn(this.notificationService, 'error').andReturn();
            spyOn(this.notificationService, 'success').andReturn();
        });

        it('should show error if no requisition is selected', function() {
            this.vm.convertToOrder();

            expect(this.notificationService.error)
                .toHaveBeenCalledWith('requisitionConvertToOrder.selectAtLeastOneRnr');
        });

        it('should not call requisitionService if no requisition is selected', function() {
            this.vm.convertToOrder();
            confirmDeferred.resolve();
            convertDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.requisitionService.convertToOrder).not.toHaveBeenCalled();
        });

        it('should show error if requisition does not have facility selected', function() {
            this.vm.requisitions[0].$selected = true;

            this.vm.convertToOrder();

            expect(this.notificationService.error)
                .toHaveBeenCalledWith('requisitionConvertToOrder.noSupplyingDepotSelected');
        });

        it('should not call requisitionService if requisition does not have facility selected', function() {
            this.vm.requisitions[0].$selected = true;

            this.vm.convertToOrder();
            confirmDeferred.resolve();
            convertDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.requisitionService.convertToOrder).not.toHaveBeenCalled();
        });

        it('should call confirmation modal', function() {
            this.vm.requisitions[0].$selected = true;
            this.vm.requisitions[0].requisition.supplyingFacility = this.supplyingDepots[0];

            this.vm.convertToOrder();
            confirmDeferred.resolve();
            convertDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.confirmService.confirm)
                .toHaveBeenCalledWith('requisitionConvertToOrder.convertToOrder.confirm');
        });

        it('should bring up loading modal if confirmation passed', function() {
            this.vm.requisitions[0].$selected = true;
            this.vm.requisitions[0].requisition.supplyingFacility = this.supplyingDepots[0];

            this.vm.convertToOrder();
            confirmDeferred.resolve();
            convertDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.loadingModalService.open).toHaveBeenCalled();
        });

        it('should call requisitionService if confirmation passed', function() {
            this.vm.requisitions[0].$selected = true;
            this.vm.requisitions[0].requisition.supplyingFacility = this.supplyingDepots[0];

            this.vm.convertToOrder();
            confirmDeferred.resolve();
            convertDeferred.resolve();
            this.$rootScope.$apply();

            var requisition = this.vm.requisitions[0],
                key = this.key;

            expect(this.requisitionService.convertToOrder).toHaveBeenCalledWith([
                requisition
            ], key);
        });

        it('should show alert if convert passed', function() {
            this.vm.requisitions[0].$selected = true;
            this.vm.requisitions[0].requisition.supplyingFacility = this.supplyingDepots[0];

            this.vm.convertToOrder();
            confirmDeferred.resolve();
            convertDeferred.resolve();
            this.$rootScope.$apply();
            loadingDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.notificationService.success)
                .toHaveBeenCalledWith('requisitionConvertToOrder.convertToOrder.success');
        });

        it('should show error if convert failed', function() {
            this.vm.requisitions[0].$selected = true;
            this.vm.requisitions[0].requisition.supplyingFacility = this.supplyingDepots[0];

            this.vm.convertToOrder();
            confirmDeferred.resolve();
            convertDeferred.reject();
            this.$rootScope.$apply();

            expect(this.notificationService.error)
                .toHaveBeenCalledWith('requisitionConvertToOrder.errorOccurred');
        });

        it('should close loading modal if convert failed', function() {
            this.vm.requisitions[0].$selected = true;
            this.vm.requisitions[0].requisition.supplyingFacility = this.supplyingDepots[0];

            this.vm.convertToOrder();
            confirmDeferred.resolve();
            convertDeferred.reject();
            this.$rootScope.$apply();

            expect(this.loadingModalService.close).toHaveBeenCalled();
        });

    });

    describe('releaseWithoutOrder', function() {
        var confirmDeferred, convertDeferred, loadingDeferred;

        beforeEach(function() {
            confirmDeferred = this.$q.defer();
            convertDeferred = this.$q.defer();
            loadingDeferred = this.$q.defer();

            spyOn(this.loadingModalService, 'open').andReturn(loadingDeferred.promise);
            spyOn(this.loadingModalService, 'close').andReturn();
            spyOn(this.confirmService, 'confirm').andReturn(confirmDeferred.promise);
            spyOn(this.requisitionService, 'releaseWithoutOrder').andReturn(convertDeferred.promise);
            spyOn(this.notificationService, 'error').andReturn();
            spyOn(this.notificationService, 'success').andReturn();
        });

        it('should show error if no requisition is selected', function() {
            this.vm.releaseWithoutOrder();

            expect(this.notificationService.error)
                .toHaveBeenCalledWith('requisitionConvertToOrder.selectAtLeastOneRnr');
        });

        it('should not call requisitionService if no requisition is selected', function() {
            this.vm.releaseWithoutOrder();
            confirmDeferred.resolve();
            convertDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.requisitionService.releaseWithoutOrder).not.toHaveBeenCalled();
        });

        it('should show error if requisition does not have facility selected', function() {
            this.vm.requisitions[0].$selected = true;

            this.vm.releaseWithoutOrder();

            expect(this.notificationService.error)
                .toHaveBeenCalledWith('requisitionConvertToOrder.noSupplyingDepotSelected');
        });

        it('should not call requisitionService if requisition does not have facility selected', function() {
            this.vm.requisitions[0].$selected = true;

            this.vm.releaseWithoutOrder();
            confirmDeferred.resolve();
            convertDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.requisitionService.releaseWithoutOrder).not.toHaveBeenCalled();
        });

        it('should call confirmation modal', function() {
            this.vm.requisitions[0].$selected = true;
            this.vm.requisitions[0].requisition.supplyingFacility = this.supplyingDepots[0];

            this.vm.releaseWithoutOrder();
            confirmDeferred.resolve();
            convertDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.confirmService.confirm)
                .toHaveBeenCalledWith('requisitionConvertToOrder.releaseWithoutOrder.confirm');
        });

        it('should bring up loading modal if confirmation passed', function() {
            this.vm.requisitions[0].$selected = true;
            this.vm.requisitions[0].requisition.supplyingFacility = this.supplyingDepots[0];

            this.vm.releaseWithoutOrder();
            confirmDeferred.resolve();
            convertDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.loadingModalService.open).toHaveBeenCalled();
        });

        it('should call requisitionService if confirmation passed', function() {
            this.vm.requisitions[0].$selected = true;
            this.vm.requisitions[0].requisition.supplyingFacility = this.supplyingDepots[0];

            this.vm.releaseWithoutOrder();
            confirmDeferred.resolve();
            convertDeferred.resolve();
            this.$rootScope.$apply();

            var requisition = this.vm.requisitions[0],
                key = this.key;

            expect(this.requisitionService.releaseWithoutOrder).toHaveBeenCalledWith([
                requisition
            ], key);
        });

        it('should show alert if release without order passed', function() {
            this.vm.requisitions[0].$selected = true;
            this.vm.requisitions[0].requisition.supplyingFacility = this.supplyingDepots[0];

            this.vm.releaseWithoutOrder();
            confirmDeferred.resolve();
            convertDeferred.resolve();
            this.$rootScope.$apply();
            loadingDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.notificationService.success)
                .toHaveBeenCalledWith('requisitionConvertToOrder.releaseWithoutOrder.success');
        });

        it('should show error if release without order failed', function() {
            this.vm.requisitions[0].$selected = true;
            this.vm.requisitions[0].requisition.supplyingFacility = this.supplyingDepots[0];

            this.vm.releaseWithoutOrder();
            confirmDeferred.resolve();
            convertDeferred.reject();
            this.$rootScope.$apply();

            expect(this.notificationService.error)
                .toHaveBeenCalledWith('requisitionConvertToOrder.errorOccurred');
        });

        it('should close loading modal if release without order failed', function() {
            this.vm.requisitions[0].$selected = true;
            this.vm.requisitions[0].requisition.supplyingFacility = this.supplyingDepots[0];

            this.vm.releaseWithoutOrder();
            confirmDeferred.resolve();
            convertDeferred.reject();
            this.$rootScope.$apply();

            expect(this.loadingModalService.close).toHaveBeenCalled();
        });

    });

    it('should show error when trying to convert to order with no supplying depot selected', function() {
        this.vm.requisitions[0].$selected = true;

        spyOn(this.requisitionService, 'convertToOrder').andReturn(this.$q.when());
        spyOn(this.notificationService, 'error').andCallThrough();

        this.vm.convertToOrder();

        expect(this.requisitionService.convertToOrder).not.toHaveBeenCalled();
        expect(this.notificationService.error)
            .toHaveBeenCalledWith('requisitionConvertToOrder.noSupplyingDepotSelected');
    });

    it('should show error when trying to convert to order with no requisition selected', function() {
        spyOn(this.requisitionService, 'convertToOrder').andReturn(this.$q.when());
        spyOn(this.notificationService, 'error').andCallThrough();

        this.vm.convertToOrder();

        expect(this.requisitionService.convertToOrder).not.toHaveBeenCalled();
        expect(this.notificationService.error)
            .toHaveBeenCalledWith('requisitionConvertToOrder.selectAtLeastOneRnr');
    });

    it('should select all requisitions', function() {
        this.vm.toggleSelectAll(true);

        expect(this.vm.requisitions[0].$selected).toBe(true);
        expect(this.vm.requisitions[1].$selected).toBe(true);
    });

    it('should deselect all requisitions', function() {
        this.vm.toggleSelectAll(false);

        expect(this.vm.requisitions[0].$selected).toBe(false);
        expect(this.vm.requisitions[1].$selected).toBe(false);
    });

    it('should set "select all" option when all requisitions are selected by user', function() {
        for (var i = 0; i < this.vm.requisitions.length; i++) {
            this.vm.requisitions[i].$selected = true;
            this.vm.onRequisitionSelect(this.vm.requisitions[i]);
        }

        this.vm.setSelectAll();

        expect(this.vm.selectAll).toBe(true);
    });

    it('should not set "select all" option when not all requisitions are selected by user', function() {
        this.vm.requisitions[0].$selected = true;
        this.vm.onRequisitionSelect(this.vm.requisitions[0]);

        for (var i = 1; i < this.vm.requisitions.length; i++) {
            this.vm.requisitions[i].$selected = false;
            this.vm.onRequisitionSelect(this.vm.requisitions[i]);
        }

        this.vm.setSelectAll();

        expect(this.vm.selectAll).toBe(false);
    });

    describe('search', function() {

        beforeEach(function() {
            spyOn(this.$state, 'go').andReturn();
        });

        it('should expose search method', function() {
            expect(angular.isFunction(this.vm.search)).toBe(true);
        });

        it('should call state go method', function() {
            this.vm.search();

            expect(this.$state.go).toHaveBeenCalled();
        });

        it('should call state go method with changed params', function() {
            this.vm.programId = 'programId';
            this.vm.facilityId = 'facilityId';
            this.vm.sort = 'sort';

            this.vm.search();

            expect(this.$state.go).toHaveBeenCalledWith('openlmis.requisitions.convertToOrder', {
                programId: 'programId',
                facilityId: 'facilityId',
                sort: 'sort',
                page: 0,
                size: 10
            }, {
                reload: true
            });
        });
    });

    describe('load selection from other pages', function() {
        beforeEach(function() {
            inject(function($injector) {
                var requisitions = [
                    {
                        requisition: {
                            id: 'currentPagePreselectedRequisitionId',
                            facility: new FacilityDataBuilder().build(),
                            program: new ProgramDataBuilder().build(),
                            supplyingFacility: this.supplyingDepots[0]
                        },
                        $selected: true,
                        supplyingDepots: this.supplyingDepots
                    },
                    {
                        requisition: {
                            id: 'otherPagePreselectedRequisitionId',
                            facility: new FacilityDataBuilder().build(),
                            program: new ProgramDataBuilder().build(),
                            supplyingFacility: this.supplyingDepots[0]
                        },
                        $selected: true,
                        supplyingDepots: this.supplyingDepots
                    }
                ];

                var window = $injector.get('$window');

                var itemKey = 'requisition-convert-to-order/selected-requisitions/key';

                window.sessionStorage.setItem(itemKey, JSON.stringify({
                    currentPagePreselectedRequisitionId: requisitions[0],
                    otherPagePreselectedRequisitionId: requisitions[1]
                }));

                var state = {
                    go: function() {
                        // NOP
                    },
                    current: {
                        name: 'current'
                    }
                };

                this.vm = $injector.get('$controller')('ConvertToOrderController', {
                    requisitions: requisitions.slice(0, 1),
                    $stateParams: {
                        programId: 'program-id',
                        facilityId: 'facility-id',
                        page: 0,
                        size: 10
                    },
                    facilities: this.vm.facilities,
                    programs: this.vm.programs,
                    $window: window,
                    $state: state
                });

                this.vm.$onInit();
            });

        });

        afterEach(function() {
            inject(function($injector) {
                $injector.get('$window').sessionStorage.clear();
            });
        });

        it('should have preselected requisitions', function() {
            expect(this.vm.getSelected().length).toBe(2);
        });

        it('should have preselected requisition from other page', function() {
            var selected = this.vm.getSelected();

            var numberOfSelectedOnOtherPages = 0;

            for (var i = 0; i < selected.length; i++) {
                var s = selected[i];
                var found = false;

                for (var j = 0; j < this.vm.requisitions.length; j++) {
                    var r = this.vm.requisitions[j];

                    if (r.$selected && r.requisition.id === s.requisition.id) {
                        found = true;
                        break;
                    }
                }

                if (found) {
                    numberOfSelectedOnOtherPages++;
                }
            }

            expect(numberOfSelectedOnOtherPages).toBeGreaterThan(0);
        });
    });

});
