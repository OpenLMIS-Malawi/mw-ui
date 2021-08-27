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

(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name proof-of-delivery.fulfillingLineItemFactory
     *
     * @description
     * Factory for creating a map of line item id and fulfilling proof of delivery line items.
     */
    angular
        .module('proof-of-delivery')
        .factory('fulfillingLineItemFactory', factory);

    factory.$inject = ['OrderableFulfillsResource'];

    function factory(OrderableFulfillsResource) {
        var factory = {
            groupByOrderable: groupByOrderable
        };
        return factory;

        /**
         * @ngdoc method
         * @methodOf proof-of-delivery.fulfillingLineItemFactory
         * @name groupByOrderable
         *
         * @description
         * Creates a map where key is Orderable Id and value is a list of fulfilling
         * proof of delivery line items.
         *
         * @param  {Array}  proofOfDeliveryLineItems the proof of delivery line items
         * @param  {Array}  orderLineItems           the order line items
         * @return {Object}                          the map of fulfilling line items
         */
        function groupByOrderable(proofOfDeliveryLineItems, orderLineItems) {

            var orderableIds = orderLineItems.map(function(lineItem) {
                return lineItem.orderable.id;
            });

            return new OrderableFulfillsResource().query({
                id: orderableIds
            })
                .then(function(orderableFulfills) {
                    var groupedFulfillingLineItems = groupLineItemsByOrderable(proofOfDeliveryLineItems);
                    orderLineItems.forEach(function(orderLineItem) {
                        var canFulfillForMe = orderableFulfills[orderLineItem.orderable.id] ?
                            orderableFulfills[orderLineItem.orderable.id].canFulfillForMe :
                            [];

                        orderLineItem.groupedLineItems = [];
                        canFulfillForMe.forEach(function(fulfillingOrderableId) {
                            var fulfillingLineItemsGroup = groupedFulfillingLineItems[fulfillingOrderableId];
                            if (fulfillingLineItemsGroup) {
                                orderLineItem.groupedLineItems.push(fulfillingLineItemsGroup);
                            }
                        });
                        var fulfillingLineItemsGroup = groupedFulfillingLineItems[orderLineItem.orderable.id];
                        if (fulfillingLineItemsGroup) {
                            orderLineItem.groupedLineItems.push(fulfillingLineItemsGroup);
                        }
                    });

                    return orderLineItems.filter(function(orderLineItem) {
                        return orderLineItem.groupedLineItems.length;
                    });
                });
        }

        function groupLineItemsByOrderable(lineItems) {
            return lineItems.reduce(function(groupedByOrderable, lineItem) {
                if (!groupedByOrderable[lineItem.orderable.id]) {
                    groupedByOrderable[lineItem.orderable.id] = [];
                }

                groupedByOrderable[lineItem.orderable.id].push(lineItem);

                return groupedByOrderable;
            }, {});
        }
    }
})();
