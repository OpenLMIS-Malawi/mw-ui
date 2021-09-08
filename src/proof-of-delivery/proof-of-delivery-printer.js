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
     * @name proof-of-delivery.ProofOfDeliveryPrinter
     *
     * @description
     * Responsible for printing an instance of the Proof of Delivery with the specified ID.
     */
    angular
        .module('proof-of-delivery')
        .factory('ProofOfDeliveryPrinter', ProofOfDeliveryPrinter);

    ProofOfDeliveryPrinter.$inject = ['classExtender', 'OpenlmisPrinter'];

    function ProofOfDeliveryPrinter(classExtender, OpenlmisPrinter) {

        classExtender.extend(ProofOfDeliveryPrinter, OpenlmisPrinter);

        return ProofOfDeliveryPrinter;

        function ProofOfDeliveryPrinter(proofOfDeliveryId) {
            this.super({
                // MW-1060: Report customized due to name change 'lot' -> 'batch number'
                resourceUri: '/api/reports/proofsOfDelivery/',
                // MW-1060: ends here
                loadingMessage: 'proofOfDelivery.preparingProofOfDelivery',
                id: proofOfDeliveryId
            });
        }

    }

})();