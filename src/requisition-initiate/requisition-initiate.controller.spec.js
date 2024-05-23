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

describe('RequisitionInitiateController', function() {

    beforeEach(function() {
        module('requisition-initiate');
        module('requisition-view-tab');

        var FacilityDataBuilder, ProgramDataBuilder, PeriodDataBuilder, RequisitionDataBuilder;

        inject(function($injector) {
            FacilityDataBuilder = $injector.get('FacilityDataBuilder');
            ProgramDataBuilder = $injector.get('ProgramDataBuilder');
            PeriodDataBuilder = $injector.get('PeriodDataBuilder');
            RequisitionDataBuilder = $injector.get('RequisitionDataBuilder');

            this.$rootScope = $injector.get('$rootScope');
            this.$state = $injector.get('$state');
            this.requisitionService = $injector.get('requisitionService');
            this.authorizationService = $injector.get('authorizationService');
            this.$q = $injector.get('$q');
            this.REQUISITION_RIGHTS = $injector.get('REQUISITION_RIGHTS');
            this.loadingModalService = $injector.get('loadingModalService');
            this.UuidGenerator = $injector.get('UuidGenerator');

            this.user = {
                //eslint-disable-next-line camelcase
                user_id: 'user_id'
            };
            this.programs = [
                new ProgramDataBuilder().build(),
                new ProgramDataBuilder().build()
            ];
            this.facility = new FacilityDataBuilder().build();
            this.periods = [
                new PeriodDataBuilder().build()
            ];
            this.$stateParams = {
                facility: this.facility.id
            };

            this.requisition = new RequisitionDataBuilder()
                .withProcessingPeriod(this.periods[0])
                .withProgram(this.programs[0])
                .withFacility(this.facility)
                .buildJson();

            this.canInitiateRnr = true;

            this.requistionSource = new RequisitionDataBuilder();

            this.permissionService = $injector.get('permissionService');
            spyOn(this.permissionService, 'hasPermission').andReturn(this.$q.resolve());

            spyOn(this.authorizationService, 'getUser').andReturn(this.user);

            this.key = 'key';

            var context = this;
            spyOn(context.UuidGenerator.prototype, 'generate').andCallFake(function() {
                return context.key;
            });

            this.vm = $injector.get('$controller')('RequisitionInitiateController', {
                periods: this.periods,
                $stateParams: this.$stateParams,
                canInitiateRnr: this.canInitiateRnr
            });
        });
    });

    it('should change page to requisitions.requisition for with selected period with rnrId', function() {
        spyOn(this.$state, 'go');

        this.vm.goToRequisition(this.requistionSource);

        expect(this.$state.go).toHaveBeenCalledWith('openlmis.requisitions.requisition.fullSupply', {
            rnr: this.requistionSource
        });
    });

    it('should change page to requisition full supply for newly initialized requisition in selected period',
        function() {
            this.vm.$onInit();
            spyOn(this.$state, 'go');
            spyOn(this.requisitionService, 'initiate').andReturn(this.$q.when(this.requisition));
            this.vm.program = this.programs[0];
            this.vm.facility = this.facility;

            this.vm.initRnr(this.periods[0]);
            this.$rootScope.$apply();

            expect(this.$state.go).toHaveBeenCalledWith('openlmis.requisitions.requisition.fullSupply', {
                rnr: this.requisition.id,
                requisition: this.requisition
            });

            expect(this.permissionService.hasPermission).toHaveBeenCalledWith('user_id', {
                right: this.REQUISITION_RIGHTS.REQUISITION_CREATE,
                programId: this.programs[0].id,
                facilityId: this.facility.id
            });
        });

    it('should initiate requisition with idempotency key', function() {
        this.vm.$onInit();
        spyOn(this.$state, 'go');
        spyOn(this.requisitionService, 'initiate').andReturn(this.$q.when(this.requisition));

        this.vm.program = this.programs[0];
        this.vm.facility = this.facility;

        this.vm.initRnr(this.periods[0]);
        this.$rootScope.$apply();

        expect(this.requisitionService.initiate)
            .toHaveBeenCalledWith(this.vm.facility.id, this.vm.program.id, this.periods[0].id,
                this.vm.emergency, this.key);
    });

    it('should display error when user has no right to init requisition', function() {
        this.permissionService.hasPermission.andReturn(this.$q.reject());

        this.vm.$onInit();
        spyOn(this.$state, 'go');
        spyOn(this.requisitionService, 'initiate');
        this.vm.program = this.programs[0];
        this.vm.facility = this.facility;

        this.vm.initRnr(this.periods[0]);
        this.$rootScope.$apply();

        expect(this.$state.go).not.toHaveBeenCalled();
        expect(this.permissionService.hasPermission).toHaveBeenCalled();
        expect(this.requisitionService.initiate).not.toHaveBeenCalled();
    });

    it('should not change page to requisitions.requisition with selected period without rnrId and when invalid' +
        ' response from service', function() {
        var selectedPeriod = {};
        spyOn(this.requisitionService, 'initiate').andReturn(this.$q.reject(this.requisition));
        spyOn(this.$state, 'go');
        this.vm.program = this.programs[0];
        this.vm.facility = this.facility;

        this.vm.initRnr(selectedPeriod);
        this.$rootScope.$apply();

        expect(this.$state.go).not.toHaveBeenCalled();
        expect(this.UuidGenerator.prototype.generate.calls.length).toEqual(2);
    });

    it('should open loading modal', function() {
        spyOn(this.loadingModalService, 'open');
        this.vm.program = this.programs[0];
        this.vm.facility = this.facility;

        this.vm.initRnr(this.periods[0]);

        expect(this.loadingModalService.open).toHaveBeenCalled();
    });

    it('should reload periods with proper data', function() {
        spyOn(this.$state, 'go');
        this.vm.program = this.programs[0];
        this.vm.facility = this.facility;
        this.vm.isSupervised = false;

        this.vm.$onInit();
        this.vm.loadPeriods();
        this.$rootScope.$apply();

        expect(this.$state.go).toHaveBeenCalledWith('openlmis.requisitions.initRnr', {
            supervised: false,
            emergency: false,
            program: this.vm.program.id,
            facility: this.vm.facility.id
        }, {
            reload: true
        });
    });
});
