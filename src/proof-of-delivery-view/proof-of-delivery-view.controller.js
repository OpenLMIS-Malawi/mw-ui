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
     * @name proof-of-delivery-view.controller:ProofOfDeliveryViewController
     *
     * @description
     * Controller that drives the POD view screen.
     */
    angular
        .module('proof-of-delivery-view')
        .controller('ProofOfDeliveryViewController', ProofOfDeliveryViewController);

    ProofOfDeliveryViewController.$inject = [
        'proofOfDelivery', 'order', 'reasons', 'messageService', 'VVM_STATUS', 'orderLineItems', 'canEdit',
        'ProofOfDeliveryPrinter', '$q'
    ];

    function ProofOfDeliveryViewController(proofOfDelivery, order, reasons, messageService, VVM_STATUS, orderLineItems,
                                           canEdit, ProofOfDeliveryPrinter, $q) {

        var vm = this;

        vm.$onInit = onInit;
        vm.getStatusDisplayName = getStatusDisplayName;
        vm.getReasonName = getReasonName;
        vm.printProofOfDelivery = printProofOfDelivery;

        /**
         * @ngdoc property
         * @propertyOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name proofOfDelivery
         * @type {Object}
         *
         * @description
         * Holds Proof of Delivery.
         */
        vm.proofOfDelivery = undefined;

        /**
         * @ngdoc property
         * @propertyOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name order
         * @type {Object}
         *
         * @description
         * Holds Order from Proof of Delivery.
         */
        vm.order = undefined;

        /**
         * @ngdoc property
         * @propertyOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name orderLineItems
         * @type {Object}
         *
         * @description
         * Holds a map of Order Line Items with Proof of Delivery Line Items grouped by orderable.
         */
        vm.orderLineItems = undefined;

        /**
         * @ngdoc property
         * @propertyOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name showVvmColumn
         * @type {boolean}
         *
         * @description
         * Indicates if VVM Status column should be shown for current Proof of Delivery.
         */
        vm.showVvmColumn = undefined;

        /**
         * @ngdoc property
         * @propertyOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name canEdit
         * @type {boolean}
         *
         * @description
         * Indicates if PoD is in initiated status and if user has permission to edit it.
         */
        vm.canEdit = undefined;

        /**
         * @ngdoc property
         * @propertyOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name reasons
         * @type {Array}
         *
         * @description
         * List of available stock reasons.
         */
        vm.reasons = undefined;

        /**
         * @ngdoc method
         * @methodOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name $onInit
         *
         * @description
         * Initialization method of the ProofOfDeliveryViewController.
         */
        function onInit() {
            vm.order = order;
            vm.reasons = reasons;
            vm.proofOfDelivery = proofOfDelivery;
            vm.orderLineItems = orderLineItems;
            vm.vvmStatuses = VVM_STATUS;
            vm.showVvmColumn = proofOfDelivery.hasProductsUseVvmStatus();
            vm.canEdit = canEdit;
        }

        /**
         * @ngdoc method
         * @methodOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name getStatusDisplayName
         *
         * @description
         * Returns translated status display name.
         */
        function getStatusDisplayName(status) {
            console.log(lotCode);
            console.log(this.lotCode);
            return messageService.get(VVM_STATUS.$getDisplayName(status));
        }

        /**
         * @ngdoc method
         * @methodOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name getReasonName
         *
         * @description
         * Returns a name of the reason with the given ID.
         *
         * @param  {string} id the ID of the reason
         * @return {string}    the name of the reason
         */
        function getReasonName(id) {
            if (!id) {
                return;
            }

            return vm.reasons.filter(function(reason) {
                return reason.id === id;
            })[0].name;
        }

        /**
         *
         * @ngdoc method
         * @methodOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name printProofOfDelivery
         *
         * @description
         * Prints the proof of delivery.
         */
        function printProofOfDelivery() {
            var printer = new ProofOfDeliveryPrinter();
            printer.openTab();

            (vm.proofOfDelivery.isInitiated() ? vm.proofOfDelivery.save() : $q.resolve(vm.proofOfDelivery))
                .then(function(proofOfDelivery) {
                    printer.setId(proofOfDelivery.id);
                    printer.print();
                })
                .catch(function() {
                    printer.closeTab();
                });
        }
    }
}());
