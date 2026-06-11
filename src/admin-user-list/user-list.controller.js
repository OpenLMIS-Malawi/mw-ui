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
     * @name admin-user-list.controller:UsersListController
     *
     * @description
     * Controller for managing user list screen.
     */
    angular
        .module('admin-user-list')
        .controller('UserListController', controller);

    controller.$inject = ['$state', '$stateParams', 'users', 'confirmService', 'userPasswordModalFactory'];

    function controller($state, $stateParams, users, confirmService, userPasswordModalFactory) {

        var vm = this;

        vm.resetUserPassword = resetUserPassword;
        vm.search = search;
        // MW-1477: isLockoutsActive hides the users list while the Lockouts tab is active
        vm.isLockoutsActive = isLockoutsActive;
        vm.$onInit = onInit;

        /**
         * @ngdoc property
         * @propertyOf admin-user-list.controller:UsersListController
         * @name users
         * @type {Array}
         *
         * @description
         * Holds user list.
         */
        vm.users = undefined;

        /**
         * @ngdoc property
         * @propertyOf admin-user-list.controller:UsersListController
         * @name firstName
         * @type {String}
         *
         * @description
         * Holds user first name filter value.
         */
        vm.firstName = undefined;

        /**
         * @ngdoc property
         * @propertyOf admin-user-list.controller:UsersListController
         * @name lastName
         * @type {String}
         *
         * @description
         * Holds user last name filter value.
         */
        vm.lastName = undefined;

        /**
         * @ngdoc property
         * @propertyOf admin-user-list.controller:UsersListController
         * @name email
         * @type {String}
         *
         * @description
         * Holds user email filter value.
         */
        vm.email = undefined;

        /**
         * @ngdoc property
         * @propertyOf admin-user-list.controller:UsersListController
         * @name username
         * @type {String}
         *
         * @description
         * Holds username filter value.
         */
        vm.username = undefined;

        /**
         * @ngdoc property
         * @propertyOf admin-user-list.controller:UsersListController
         * @name options
         * @type {Object}
         *
         * @description
         * Holds options for sorting user list.
         */
        vm.options = {
            'adminUserList.firstName': ['firstName'],
            'adminUserList.lastName': ['lastName'],
            'adminUserList.username': ['username']
        };

        /**
         * @ngdoc method
         * @methodOf admin-user-list.controller:UsersListController
         * @name onInit
         *
         * @description
         * Method that is executed on initiating UsersListController.
         */
        function onInit() {
            vm.users = users;
            vm.firstName = $stateParams.firstName;
            vm.lastName = $stateParams.lastName;
            vm.email = $stateParams.email;
            vm.username = $stateParams.username;
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-list.controller:UsersListController
         * @name resetUserPassword
         *
         * @description
         * Opens a modal for entering new user password.
         *
         * @param {Object} user    the user whose password is being reset
         */
        function resetUserPassword(user) {
            userPasswordModalFactory.resetPassword(user).then(function() {
                $state.reload();
            });
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-list.controller:UsersListController
         * @name isLockoutsActive
         *
         * @description
         * Whether the Lockouts tab (child state) is currently active. Used to hide the users
         * list while the Lockouts tab is shown in this page's ui-view.
         *
         * @return {Boolean} true when the lockouts child state is active
         */
        function isLockoutsActive() {
            return $state.includes('openlmis.administration.users.lockouts');
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-list.controller:UsersListController
         * @name search
         *
         * @description
         * Reloads page with new search parameters.
         */
        function search() {
            var stateParams = angular.copy($stateParams);

            stateParams.lastName = vm.lastName;
            stateParams.firstName = vm.firstName;
            stateParams.email = vm.email;
            stateParams.username = vm.username;

            $state.go('openlmis.administration.users', stateParams, {
                reload: true
            });
        }
    }

})();
