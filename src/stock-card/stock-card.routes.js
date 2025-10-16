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

    angular
        .module('stock-card')
        .config(routes);

    routes.$inject = ['$stateProvider', 'STOCKMANAGEMENT_RIGHTS'];

    function routes($stateProvider, STOCKMANAGEMENT_RIGHTS) {
        $stateProvider.state('openlmis.stockmanagement.stockCardSummaries.singleCard', {
            url: '/:stockCardId?stockCardPage&stockCardSize',
            showInNavigation: false,
            isOffline: true,
            views: {
                '@openlmis': {
                    controller: 'StockCardController',
                    templateUrl: 'stock-card/stock-card.html',
                    controllerAs: 'vm'
                }
            },
            accessRights: [STOCKMANAGEMENT_RIGHTS.STOCK_CARDS_VIEW],
            resolve: {
                stockCard: function($stateParams, stockCardService, paginationService, StockCard, alertService, $q) {
                    return stockCardService
                        .getStockCard($stateParams.stockCardId)
                        .then(function(json) {
                            var stockCard = new StockCard(json);
                            //display new line item on top
                            stockCard.lineItems.reverse();
                            $stateParams.stockCardSize = '@@STOCKMANAGEMENT_PAGE_SIZE';
                            paginationService.registerList(null, $stateParams, function() {
                                return stockCard.lineItems;
                            }, {
                                paginationId: 'stockCard'
                            });
                            return stockCard;
                        })
                        .catch(function(error) {
                            alertService.error(error.message);
                            return $q.reject();
                        });
                },
                // <!-- Malawi starts here -->
                ftaps: function(FacilityTypeApprovedProductRepository, stockCard) {
                    return new FacilityTypeApprovedProductRepository().query({
                        orderableId: stockCard.orderable.id,
                        facilityType: stockCard.facility.type.code,
                        program: stockCard.program.code
                    })
                        .then(function(ftaps) {
                            return ftaps.content;
                        });
                }
                // <!-- Malawi ends here -->
            }
        });
    }
})();

