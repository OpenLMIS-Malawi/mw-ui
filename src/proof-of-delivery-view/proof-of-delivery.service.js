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
     * @name proof-of-delivery.proofOfDeliveryService
     *
     * @description
     * Application layer service that prepares domain objects to be used on the view.
     */
    angular
        .module('proof-of-delivery-view')
        .service('proofOfDeliveryService', proofOfDeliveryService);

    proofOfDeliveryService.$inject = [
        '$q', 'ProofOfDeliveryRepository', 'ProofOfDeliveryRepositoryImpl', 'notificationService',
        'loadingModalService', 'confirmService', 'stateTrackerService'
    ];

    function proofOfDeliveryService($q, ProofOfDeliveryRepository, ProofOfDeliveryRepositoryImpl,
                                    notificationService, loadingModalService, confirmService, stateTrackerService) {
        var proofOfDeliveryService = this,
            repository = new ProofOfDeliveryRepository(
                new ProofOfDeliveryRepositoryImpl()
            );

        proofOfDeliveryService.get = get;

        /**
         * @ngdoc method
         * @methodOf proof-of-delivery.proofOfDeliveryService
         * @name get
         *
         * @description
         * Returns a domain object representing a Proof of Delivery decorated with loading modal
         * and notifications for success/unsuccessful actions.
         *
         * @param  {string}     id  the ID of the Proof of Delivery
         * @return {Promise}        the promise resolving to decorated Proof of Delivery
         */
        function get(id) {
            if (id) {
                return repository.get(id)
                    .then(function(proofOfDelivery) {
                        decorateSave(proofOfDelivery);
                        decorateConfirm(proofOfDelivery);
                        return proofOfDelivery;
                    });
            }
            return $q.reject();
        }

        function decorateConfirm(proofOfDelivery) {
            var originalConfirm = proofOfDelivery.confirm;
            proofOfDelivery.confirm = function() {
                return confirmService.confirm(
                    'proofOfDeliveryView.confirm.message',
                    'proofOfDeliveryView.confirm.label'
                )
                    .then(function() {
                        loadingModalService.open();
                        return originalConfirm.apply(proofOfDelivery)
                            .then(function() {
                                notificationService.success(
                                    'proofOfDeliveryView.proofOfDeliveryHasBeenConfirmed'
                                );
                                stateTrackerService.goToPreviousState('openlmis.orders.podManage');
                            })
                            .catch(function() {
                                notificationService.error(
                                    'proofOfDeliveryView.failedToConfirmProofOfDelivery'
                                );
                                return $q.reject();
                            })
                            .finally(loadingModalService.close);
                    });
            };
        }

        function decorateSave(proofOfDelivery) {
            var originalSave = proofOfDelivery.save;
            proofOfDelivery.save = function() {
                loadingModalService.open();
                return originalSave.apply(this)
                    .then(function(proofOfDelivery) {
                        notificationService.success('proofOfDeliveryView.proofOfDeliveryHasBeenSaved');
                        return proofOfDelivery;
                    })
                    .catch(function() {
                        notificationService.error('proofOfDeliveryView.failedToSaveProofOfDelivery');
                        return $q.reject();
                    })
                    .finally(loadingModalService.close);
            };
        }
    }

})();
