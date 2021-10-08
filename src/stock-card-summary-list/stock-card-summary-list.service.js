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
// MALAWISUP-3068: Add filter in SOH
(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name stock-card-summary-list.stockCardSummaryListService
     *
     * @description
     * Responsible for search and submit stock card summaries.
     */
    angular
        .module('stock-card-summary-list')
        .service('stockCardSummaryListService', service);

    service.$inject = [
        'openlmisDateFilter', 'productNameFilter', 'dateUtils'
    ];

    function service(openlmisDateFilter, productNameFilter, dateUtils) {

        this.search = search;

        function search(keyword, stockCardSummaries) {
            var result = [];

            if (_.isEmpty(keyword)) {
                result = stockCardSummaries;
            } else {
                keyword = keyword.trim();
                result = _.filter(stockCardSummaries, function(item) {
                    var searchableFields = [
                        item.orderable.productCode,
                        productNameFilter(item.orderable),
                        openlmisDateFilter(dateUtils.toDate(item.occurredDate))
                    ];
                    return _.any(searchableFields, function(field) {
                        if (field === undefined) {
                            return false;
                        }
                        return field.toLowerCase().contains(keyword.toLowerCase());
                    });
                });
            }

            return result;
        }
    }
    // MALAWISUP-3068: ends here
})();