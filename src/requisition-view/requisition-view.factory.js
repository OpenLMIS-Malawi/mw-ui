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
     * @name requisition-view.requisitionViewFactory
     *
     * @description
     * Takes a requisition and determines what the user is able to view.
     */
    angular
        .module('requisition-view')
        .factory('requisitionViewFactory', factory);

    factory.$inject = ['$q', 'permissionService', 'REQUISITION_RIGHTS'];

    function factory($q, permissionService, REQUISITION_RIGHTS) {

        var factory = {
            canSubmit: canSubmit,
            canAuthorize: canAuthorize,
            canApproveAndReject: canApproveAndReject,
            canDelete: canDelete,
            canSkip: canSkip,
            canUnskipRequisitionItemWhenApproving: canUnskipRequisitionItemWhenApproving
        };
        return factory;

        /**
         * @ngdoc method
         * @methodOf requisition-view.requisitionViewFactory
         * @name canSubmit
         *
         * @description
         * Determines whether the user can submit or not. Returns true only if requisition
         * is initiated/rejected and user has permission to create requisition.
         *
         * @param  {String} userId id of user to check
         * @param  {Object} requisition requisition to check
         * @return {Boolean} can user submit this requisition
         */
        function canSubmit(userId, requisition) {
            if (requisition.$isInitiated() || requisition.$isRejected()) {
                return hasRightForProgramAndFacility(userId, REQUISITION_RIGHTS.REQUISITION_CREATE, requisition);
            }
            return $q.resolve(false);

        }

        /**
         * @ngdoc method
         * @methodOf requisition-view.requisitionViewFactory
         * @name canAuthorize
         *
         * @description
         * Determines whether the user can authorize or not. Returns true only if requisition
         * is submitted and user has permission to authorize requisition.
         *
         * @param  {String} userId id of user to check
         * @param  {Object} requisition requisition to check
         * @return {Boolean} can user authorize this requisition
         */
        function canAuthorize(userId, requisition) {
            if (requisition.$isSubmitted()) {
                return hasRightForProgramAndFacility(userId, REQUISITION_RIGHTS.REQUISITION_AUTHORIZE, requisition);
            }
            return $q.resolve(false);

        }

        /**
         * @ngdoc method
         * @methodOf requisition-view.requisitionViewFactory
         * @name canApproveAndReject
         *
         * @description
         * Determines whether the user can approve and reject or not. Returns true only if
         * requisition is authorized or in approval and user has permission to approve requisition.
         *
         * @param  {String} user user to check
         * @param  {Object} requisition requisition to check
         * @return {Boolean} can user approve and reject this requisition
         */
        function canApproveAndReject(user, requisition) {
            if (requisition.$isAuthorized() || requisition.$isInApproval()) {
                // MALAWISUP-4404: 
                return permissionService.hasRoleWithRightForProgramAndSupervisoryNode(
                    REQUISITION_RIGHTS.REQUISITION_APPROVE, requisition
                );
                // MALAWISUP-4404: Ends here
            }
            return $q.resolve(false);

        }

        /**
         * @ngdoc method
         * @methodOf requisition-view.requisitionViewFactory
         * @name canDelete
         *
         * @description
         * Determines whether the user can delete or not. Returns true only if
         * user has permission to delete requisition. User needs to have create right when
         * requisition is initiated and authorize right when requisition is in submitted state.
         *
         * @param  {String} userId id of user to check
         * @param  {Object} requisition requisition to check
         * @return {Boolean} can user delete this requisition
         */
        function canDelete(userId, requisition) {
            if (requisition.$isInitiated() || requisition.$isRejected() || requisition.$isSkipped()) {
                return $q.all([
                    hasRightForProgramAndFacility(userId, REQUISITION_RIGHTS.REQUISITION_DELETE, requisition),
                    hasRightForProgramAndFacility(userId, REQUISITION_RIGHTS.REQUISITION_CREATE, requisition)
                ]).then(function(responses) {
                    var hasDeleteRight = responses[0],
                        hasCreateRight = responses[1];

                    if (hasDeleteRight && hasCreateRight) {
                        return $q.resolve(true);
                    }
                    return $q.resolve(false);

                });
            } else if (requisition.$isSubmitted()) {
                return $q.all([
                    hasRightForProgramAndFacility(userId, REQUISITION_RIGHTS.REQUISITION_DELETE, requisition),
                    hasRightForProgramAndFacility(userId, REQUISITION_RIGHTS.REQUISITION_AUTHORIZE, requisition)
                ]).then(function(responses) {
                    var hasDeleteRight = responses[0],
                        hasAuthorizeRight = responses[1];

                    if (hasDeleteRight && hasAuthorizeRight) {
                        return $q.resolve(true);
                    }
                    return $q.resolve(false);

                });
            }
            return $q.resolve(false);

        }

        /**
         * @ngdoc method
         * @methodOf requisition-view.requisitionViewFactory
         * @name canSkip
         *
         * @description
         * Determines whether the user can skip requisition or not.
         *
         * @param  {String} userId id of user to check
         * @param  {Object} requisition requisition to check
         * @return {Boolean} can user skip this requisition
         */
        function canSkip(userId, requisition, program) {
            if ((requisition.$isInitiated() || requisition.$isRejected()) &&
                program.periodsSkippable && !requisition.emergency) {
                return hasRightForProgramAndFacility(userId, REQUISITION_RIGHTS.REQUISITION_CREATE, requisition);
            }
            return $q.resolve(false);

        }

        function hasRightForProgramAndFacility(userId, rightName, requisition) {
            return permissionService.hasPermission(userId, {
                right: rightName,
                programId: requisition.program.id,
                facilityId: requisition.facility.id
            })
                .then(function() {
                    return $q.resolve(true);
                })
                .catch(function() {
                    return $q.resolve(false);
                });
        }

        function canUnskipRequisitionItemWhenApproving(requisition) {
            return requisition.unskipRequisitionWhenApproving()
                .then(function(response) {
                    return $q.resolve(response.unskipRequisition);
                })
                .catch(function(error) {
                    return $q.resolve(error);
                });
        }
    }

})();