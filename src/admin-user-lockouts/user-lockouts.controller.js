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
     * @name admin-user-lockouts.controller:UserLockoutsController
     *
     * @description
     * Controller for the Lockouts screen. Lists locked-out users, lets the administrator
     * pick which ones to unlock (selection persists across pagination) and submits all of
     * them with a single Save.
     */
    angular
        .module('admin-user-lockouts')
        .controller('UserLockoutsController', controller);

    controller.$inject = [
        '$state', '$stateParams', 'users', 'confirmService', 'messageService',
        'openlmisModalService', 'userLockoutService', 'userLockoutSelectionService', 'loadingModalService',
        'notificationService'
    ];

    function controller($state, $stateParams, users, confirmService, messageService,
                        openlmisModalService, userLockoutService, userLockoutSelectionService,
                        loadingModalService, notificationService) {

        var vm = this;

        vm.$onInit = onInit;
        vm.search = search;
        vm.toggle = toggle;
        vm.hasSelection = hasSelection;
        vm.save = save;

        /**
         * @ngdoc property
         * @propertyOf admin-user-lockouts.controller:UserLockoutsController
         * @name users
         * @type {Array}
         *
         * @description
         * Holds the current page of locked-out users.
         */
        vm.users = undefined;

        /**
         * @ngdoc property
         * @propertyOf admin-user-lockouts.controller:UserLockoutsController
         * @name options
         * @type {Object}
         *
         * @description
         * Sorting options - identical to the Users tab.
         */
        vm.options = {
            'adminUserLockouts.firstName': ['firstName'],
            'adminUserLockouts.lastName': ['lastName'],
            'adminUserLockouts.username': ['username']
        };

        function onInit() {
            vm.users = users;
            // Seed each row's checkbox from the persisted selection so choices survive
            // pagination (each page reload builds fresh user objects).
            angular.forEach(vm.users, function(user) {
                user.selected = userLockoutSelectionService.isSelected(user.id);
            });
            vm.firstName = $stateParams.firstName;
            vm.lastName = $stateParams.lastName;
            vm.email = $stateParams.email;
            vm.username = $stateParams.username;
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-lockouts.controller:UserLockoutsController
         * @name search
         *
         * @description
         * Reloads the page with the new filter values.
         */
        function search() {
            var stateParams = angular.copy($stateParams);

            stateParams.firstName = vm.firstName;
            stateParams.lastName = vm.lastName;
            stateParams.email = vm.email;
            stateParams.username = vm.username;

            $state.go('openlmis.administration.users.lockouts', stateParams, {
                reload: true
            });
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-lockouts.controller:UserLockoutsController
         * @name toggle
         *
         * @description
         * Persists the row's current checkbox state into the cross-pagination selection.
         *
         * @param {Object} user the toggled user (its `selected` flag holds the new state)
         */
        function toggle(user) {
            userLockoutSelectionService.set(user, user.selected);
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-lockouts.controller:UserLockoutsController
         * @name hasSelection
         *
         * @return {Boolean} true when at least one user is selected (enables Save)
         */
        function hasSelection() {
            return userLockoutSelectionService.count() > 0;
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-lockouts.controller:UserLockoutsController
         * @name save
         *
         * @description
         * Asks for confirmation, unlocks the selected users and shows a summary of the
         * result. On success the table is reloaded so the unlocked users drop out.
         */
        function save() {
            var selected = userLockoutSelectionService.getSelected();

            confirmService.confirm(
                buildConfirmMessage(selected),
                'adminUserLockouts.unlock',
                undefined,
                'adminUserLockouts.confirm.title'
            ).then(function() {
                var usernamesById = userLockoutSelectionService.getUsernamesById();

                loadingModalService.open();
                return userLockoutService.unlock(userLockoutSelectionService.getSelectedIds())
                    .then(function(summary) {
                        loadingModalService.close();
                        return openSummary(summary, usernamesById);
                    })
                    .catch(function() {
                        loadingModalService.close();
                        notificationService.error('adminUserLockouts.unlock.failed');
                    });
            });
        }

        function openSummary(summary, usernamesById) {
            return openlmisModalService.createDialog({
                templateUrl: 'admin-user-lockouts/user-lockout-summary-modal.html',
                controller: 'UserLockoutSummaryModalController',
                controllerAs: 'vm',
                resolve: {
                    summary: function() {
                        return summary;
                    },
                    usernamesById: function() {
                        return usernamesById;
                    }
                }
            }).promise.finally(function() {
                userLockoutSelectionService.clear();
                $state.reload();
            });
        }

        function buildConfirmMessage(selected) {
            var message = messageService.get('adminUserLockouts.confirm.message', {
                count: selected.length
            });

            var items = selected.map(function(user) {
                return '<li>' + escapeHtml(user.username) + '</li>';
            }).join('');

            return '<p>' + message + '</p><ul>' + items + '</ul>';
        }

        function escapeHtml(value) {
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }
    }

})();
