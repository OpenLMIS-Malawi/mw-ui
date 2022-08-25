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
     * @name admin-user-roles.controller:UserRolesController
     *
     * @description
     * Exposes method for saving user roles.
     */
    angular
        .module('admin-user-roles')
        .controller('UserRolesController', controller);

    controller.$inject = ['user', 'loadingModalService', '$state', 'notificationService', 'ROLE_TYPES', 'confirmService'];

    function controller(user, loadingModalService, $state, notificationService, ROLE_TYPES, confirmService) {

        var vm = this;

        vm.$onInit = onInit;
        vm.goToUserList = goToUserList;
        vm.saveUserRoles = saveUserRoles;
        vm.getRoleTypeLabel = getRoleTypeLabel;

        /**
         * @ngdoc property
         * @propertyOf admin-user-roles.controller:UserRolesController
         * @name user
         * @type {Object}
         *
         * @description
         * User object to be created/updated.
         */
        vm.user = undefined;

        /**
         * @ngdoc property
         * @propertyOf admin-user-roles.controller:UserRolesController
         * @name roleTypes
         * @type {Array}
         *
         * @description
         * List of all role types.
         */
        vm.roleTypes = undefined;

        /**
         * @ngdoc method
         * @methodOf admin-user-roles.controller:UserRolesController
         * @name $onInit
         *
         * @description
         * Initialization method of the UserFormModalController.
         */
        function onInit() {
            vm.user = user;
            vm.user.enabled = true;

            vm.roleTypes = ROLE_TYPES.getRoleTypes();
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-roles.controller:UserRolesController
         * @name saveUserRoles
         *
         * @description
         * Updates user roles.
         */
        function saveUserRoles(action) {

            if (action === 'delete') {
                return confirmService.confirmDestroy('adminUserRoles.removeRole.question', 'adminUserRoles.removeRole.label')
                    .then(function() {
                        var loadingPromise = loadingModalService.open(true);
                        loadingPromise.then(function() {
                            notificationService.success('adminUserRoles.deleteSuccessful');
                        });
                        goToUserList();
                    }, function() {
                        notificationService.error('adminUserRoles.deleteFailed');
                    }
                    ).finally(loadingModalService.close);
            }

            var loadingPromise = loadingModalService.open(true);
            return vm.user.save().then(function() {
                loadingPromise.then(function() {
                    notificationService.success('adminUserRoles.updateSuccessful');
                });
                goToUserList();
            }, function() {
                notificationService.error('adminUserRoles.updateFailed');
            })
                .finally(loadingModalService.close);
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-roles.controller:UserRolesController
         * @name goToUserList
         *
         * @description
         * Redirects to user list.
         */
        function goToUserList() {
            $state.go('openlmis.administration.users', {}, {
                reload: true
            });
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-roles.controller:UserRolesController
         * @name goToUserList
         *
         * @description
         * Redirects to user list.
         *
         * @param  {String} type the role type name
         * @return {String}      the message key for given role type
         */
        function getRoleTypeLabel(type) {
            return ROLE_TYPES.getLabel(type);
        }
    }
})();