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

    // MALAWISUP-7421: Only let the user batch approve requisitions awaiting them at their approval level
    var APPROVABLE_PAGE_SIZE = 2000;
    // MALAWISUP-7421: Ends here

    angular
        .module('requisition-batch-approval')
        .config(routes);

    routes.$inject = ['$stateProvider', 'REQUISITION_RIGHTS'];

    function routes($stateProvider, REQUISITION_RIGHTS) {

        $stateProvider.state('openlmis.requisitions.batchApproval', {
            isOffline: true,
            label: 'requisitionBatchApproval.batchApproval',
            url: '/batchApproval?ids',
            accessRights: [REQUISITION_RIGHTS.REQUISITION_APPROVE],
            resolve: {
                requisitions: getRequisitions
            },
            params: {
                errors: {}
            },
            views: {
                '@': {
                    controller: 'RequisitionBatchApprovalController',
                    controllerAs: 'vm',
                    templateUrl: 'requisition-batch-approval/requisition-batch-approval.html'
                }
            }
        });
    }

    // MALAWISUP-7421: Only let the user batch approve requisitions awaiting them at their approval level
    getRequisitions.$inject = [
        '$stateParams', 'requisitionBatchApprovalService', '$q', 'requisitionService', 'offlineService'
    ];
    function getRequisitions($stateParams, requisitionBatchApprovalService, $q, requisitionService, offlineService) {
        var requisitionsPromise = requisitionBatchApprovalService.get($stateParams.ids.split(','));

        if (offlineService.isOffline()) {
            return requisitionsPromise;
        }

        return $q
            .all([requisitionsPromise, getApprovableRequisitionIds($q, requisitionService)])
            .then(function(responses) {
                var requisitions = responses[0],
                    approvableIds = responses[1];

                return requisitions.filter(function(requisition) {
                    return approvableIds.indexOf(requisition.id) > -1;
                });
            });
    }

    function getApprovableRequisitionIds($q, requisitionService) {
        return requisitionService.forApproval({
            page: 0,
            size: APPROVABLE_PAGE_SIZE
        })
            .then(function(firstPage) {
                var ids = toIds(firstPage.content),
                    pagePromises = [];

                for (var pageNumber = 1; pageNumber < firstPage.totalPages; pageNumber += 1) {
                    pagePromises.push(requisitionService.forApproval({
                        page: pageNumber,
                        size: APPROVABLE_PAGE_SIZE
                    }));
                }

                if (!pagePromises.length) {
                    return ids;
                }

                return $q.all(pagePromises)
                    .then(function(pages) {
                        return pages.reduce(function(result, page) {
                            return result.concat(toIds(page.content));
                        }, ids);
                    });
            });
    }

    function toIds(requisitions) {
        return (requisitions || []).map(function(requisition) {
            return requisition.id;
        });
    }
    // MALAWISUP-7421: Ends here

})();