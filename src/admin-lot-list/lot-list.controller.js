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
     * @ngdoc controller
     * @name admin-lot-list.controller:LotListController
     *
     * @description
     * Controller for managing lot list screen.
     */
    angular
        .module('admin-lot-list')
        .controller('LotListController', controller);

    controller.$inject = ['$state', '$stateParams', 'lots', 'orderables'];

    function controller($state, $stateParams, lots, orderables) {

        var vm = this;
        vm.$onInit = onInit;

        /**
         * @ngdoc property
         * @propertyOf admin-lot-list.controller:LotListController
         * @name lots
         * @type {Array}
         *
         * @description
         * Contains filtered lots.
         */
        vm.lots = [];

        /**
         * @ngdoc property
         * @propertyOf admin-lot-list.controller:LotListController
         * @name orderables
         * @type {Array}
         *
         * @description
         * Contains orderables visible in filter
         */
        vm.orderables = [];

        /**
         * @ngdoc property
         * @propertyOf admin-lot-list.controller:LotListController
         * @name orderableId
         * @type {String}
         *
         * @description
         * Orderable id to filter by
         * When set to null, no lots are visible
         * When set to '*', all lots are visible
         * When set to uuid, lots for specific orderable are visible
         */
        vm.orderableId = null;

        // MALAWISUP-3895: Filtering by lot code
        /**
         * @ngdoc property
         * @propertyOf admin-lot-list.controller:LotListController
         * @name lotCode
         * @type {String}
         */
        vm.lotCode = null;
        // MALAWISUP-3895: Ends here

        /**
         * @ngdoc property
         * @propertyOf admin-lot-list.controller:LotListController
         * @name expirationDateFrom
         * @type {String}
         */
        vm.expirationDateFrom = null;

        /**
         * @ngdoc property
         * @propertyOf admin-lot-list.controller:LotListController
         * @name expirationDateTo
         * @type {String}
         */
        vm.expirationDateTo = null;

        /**
         * @ngdoc method
         * @methodOf admin-lot-list.controller:LotListController
         * @name search
         *
         * @description
         * Filters lots
         */
        vm.search = function() {
            var stateParams = angular.copy($stateParams);

            stateParams.orderableId = vm.orderableId;
            stateParams.expirationDateFrom = vm.expirationDateFrom;
            stateParams.expirationDateTo = vm.expirationDateTo;

            // MALAWISUP-3895: Filtering by lot code
            stateParams.lotCode = vm.lotCode;
            // MALAWISUP-3895: Ends here

            $state.go('openlmis.administration.lots', stateParams, {
                reload: true
            });
        };

        /**
         * @ngdoc method
         * @methodOf admin-lot-list.controller:LotListController
         * @name $onInit
         *
         * @description
         * Initializes controller
         */
        function onInit() {
            vm.lots = lots;
            vm.orderables = orderables;

            vm.orderableId = $stateParams.orderableId;
            vm.expirationDateFrom = $stateParams.expirationDateFrom;
            vm.expirationDateTo = $stateParams.expirationDateTo;

            // MALAWISUP-3895: Filtering by lot code
            vm.lotCode = $stateParams.lotCode;
            // MALAWISUP-3895: Ends here
        }
    }

})();
