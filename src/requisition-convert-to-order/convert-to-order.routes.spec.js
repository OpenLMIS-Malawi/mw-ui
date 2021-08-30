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

describe('openlmis.requisitions.convertToOrder', function() {

    beforeEach(function() {
        module('requisition-convert-to-order');

        var ProgramDataBuilder, FacilityDataBuilder, RequisitionDataBuilder,
            PageDataBuilder;

        inject(function($injector) {
            ProgramDataBuilder = $injector.get('ProgramDataBuilder');
            FacilityDataBuilder = $injector.get('FacilityDataBuilder');
            RequisitionDataBuilder = $injector.get('RequisitionDataBuilder');
            PageDataBuilder = $injector.get('PageDataBuilder');

            this.$q = $injector.get('$q');
            this.$location = $injector.get('$location');
            this.$rootScope = $injector.get('$rootScope');
            this.facilityService = $injector.get('facilityService');
            this.programService = $injector.get('programService');
            this.paginationService = $injector.get('paginationService');
            this.requisitionService = $injector.get('requisitionService');
            this.$state = $injector.get('$state');
            this.$templateCache = $injector.get('$templateCache');
        });

        this.programs = [
            new ProgramDataBuilder().build(),
            new ProgramDataBuilder().build()
        ];

        this.facilities = [
            new FacilityDataBuilder().build(),
            new FacilityDataBuilder().build()
        ];

        this.requisitions = [
            {
                requisition: new RequisitionDataBuilder().buildJson(),
                supplyingDepots: [
                    new FacilityDataBuilder().build(),
                    new FacilityDataBuilder().build()
                ]
            },
            {
                requisition: new RequisitionDataBuilder().buildJson(),
                supplyingDepots: [
                    new FacilityDataBuilder().build(),
                    new FacilityDataBuilder().build()
                ]
            }
        ];

        spyOn(this.requisitionService, 'forConvert')
            .andReturn(this.$q.resolve(new PageDataBuilder()
                .withContent(this.requisitions)
                .build()));
        spyOn(this.programService, 'getAll').andReturn(this.$q.resolve(this.programs));
        spyOn(this.facilityService, 'getAllMinimal').andReturn(this.$q.resolve(this.facilities));
        spyOn(this.$templateCache, 'get').andCallThrough();

        this.goToUrl = goToUrl;
        this.getResolvedValue = getResolvedValue;
    });

    describe('state', function() {

        it('should be available under "/requisitions/convertToOrder" URI', function() {
            expect(this.$state.current.name).not.toEqual('openlmis.requisitions.convertToOrder');

            this.goToUrl('/requisitions/convertToOrder');

            expect(this.$state.current.name).toEqual('openlmis.requisitions.convertToOrder');
        });

        it('should use template', function() {
            this.goToUrl('/requisitions/convertToOrder');

            expect(this.$templateCache.get)
                .toHaveBeenCalledWith('requisition-convert-to-order/convert-to-order.html');
        });

        it('should resolve facilities', function() {
            this.goToUrl('/requisitions/convertToOrder');

            expect(this.getResolvedValue('facilities')).toEqual(this.facilities);
            expect(this.facilityService.getAllMinimal).toHaveBeenCalled();
        });

        it('should resolve programs', function() {
            this.goToUrl('/requisitions/convertToOrder');

            expect(this.getResolvedValue('programs')).toEqual(this.programs);
            expect(this.programService.getAll).toHaveBeenCalled();
        });
    });

    function goToUrl(url) {
        this.$location.url(url);
        this.$rootScope.$apply();
    }

    function getResolvedValue(name) {
        return this.$state.$current.locals.globals[name];
    }

});
