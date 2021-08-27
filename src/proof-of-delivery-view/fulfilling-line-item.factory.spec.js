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

describe('fulfillingLineItemFactory', function() {

    var $q, $rootScope, fulfillingLineItemFactory, OrderableFulfillsResource,
        orderLineItems, proofOfDeliveryLineItems, orderableFulfills,
        OrderLineItemDataBuilder, ProofOfDeliveryLineItemDataBuilder;

    beforeEach(function() {
        module('proof-of-delivery-view', function($provide) {
            OrderableFulfillsResource = jasmine.createSpyObj('OrderableFulfillsResource', ['query']);
            $provide.factory('OrderableFulfillsResource', function() {
                return function() {
                    return OrderableFulfillsResource;
                };
            });
        });

        inject(function($injector) {
            $q = $injector.get('$q');
            $rootScope = $injector.get('$rootScope');
            fulfillingLineItemFactory = $injector.get('fulfillingLineItemFactory');
            OrderLineItemDataBuilder = $injector.get('OrderLineItemDataBuilder');
            ProofOfDeliveryLineItemDataBuilder = $injector.get('ProofOfDeliveryLineItemDataBuilder');
        });

        orderLineItems = [
            new OrderLineItemDataBuilder().build(),
            new OrderLineItemDataBuilder().build()
        ];

        proofOfDeliveryLineItems = [
            new ProofOfDeliveryLineItemDataBuilder().build(),
            new ProofOfDeliveryLineItemDataBuilder().build(),
            new ProofOfDeliveryLineItemDataBuilder().build()
        ];

        orderableFulfills = {};
        orderableFulfills[orderLineItems[0].orderable.id] = {
            canFulfillForMe: [
                proofOfDeliveryLineItems[0].orderable.id,
                proofOfDeliveryLineItems[1].orderable.id
            ],
            canBeFulfilledByMe: []
        };
        orderableFulfills[orderLineItems[1].orderable.id] = {
            canFulfillForMe: [
                proofOfDeliveryLineItems[2].orderable.id
            ],
            canBeFulfilledByMe: []
        };

        OrderableFulfillsResource.query.andReturn($q.resolve(orderableFulfills));
    });

    describe('groupByOrderable', function() {

        it('should reject if request for orderable fulfills fails', function() {
            var spy = jasmine.createSpy();
            OrderableFulfillsResource.query.andReturn($q.reject());

            fulfillingLineItemFactory.groupByOrderable(proofOfDeliveryLineItems, orderLineItems)
                .catch(spy);
            $rootScope.$apply();

            expect(spy).toHaveBeenCalled();
        });

        it('should return empty list for empty list of order line items', function() {
            var result;
            orderLineItems = [];

            fulfillingLineItemFactory.groupByOrderable(proofOfDeliveryLineItems, [])
                .then(function(response) {
                    result = response;
                });
            $rootScope.$apply();

            expect(result).toEqual([]);
        });

        it('should return empty order line items if there are no pod line items', function() {
            var result;

            fulfillingLineItemFactory.groupByOrderable([], orderLineItems)
                .then(function(response) {
                    result = response;
                });
            $rootScope.$apply();

            expect(result.length).toEqual(0);
        });

        it('should group proof of delivery line items by order line items', function() {
            var result;

            fulfillingLineItemFactory.groupByOrderable(proofOfDeliveryLineItems, orderLineItems)
                .then(function(response) {
                    result = response;
                });
            $rootScope.$apply();

            expect(result[0].groupedLineItems).toEqual([
                [proofOfDeliveryLineItems[0]],
                [proofOfDeliveryLineItems[1]]
            ]);

            expect(result[1].groupedLineItems).toEqual([[
                proofOfDeliveryLineItems[2]
            ]]);
        });

        it('should group proof of delivery line items by order line items and trade items', function() {
            var result;

            var newPodLineItem = angular.copy(proofOfDeliveryLineItems[0]);
            proofOfDeliveryLineItems.push(newPodLineItem);

            fulfillingLineItemFactory.groupByOrderable(proofOfDeliveryLineItems, orderLineItems)
                .then(function(response) {
                    result = response;
                });
            $rootScope.$apply();

            expect(result[0].groupedLineItems).toEqual([
                [proofOfDeliveryLineItems[0], newPodLineItem],
                [proofOfDeliveryLineItems[1]]
            ]);

            expect(result[1].groupedLineItems).toEqual([[
                proofOfDeliveryLineItems[2]
            ]]);
        });

        it('should filter out empty groups', function() {
            var result;

            proofOfDeliveryLineItems = [proofOfDeliveryLineItems[0], proofOfDeliveryLineItems[1]];

            fulfillingLineItemFactory.groupByOrderable(proofOfDeliveryLineItems, orderLineItems)
                .then(function(response) {
                    result = response;
                });
            $rootScope.$apply();

            expect(result.length).toEqual(1);
            expect(result[0].groupedLineItems).toEqual([
                [proofOfDeliveryLineItems[0]],
                [proofOfDeliveryLineItems[1]]
            ]);
        });
    });
});
