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
     * @name admin-user-lockouts.controller:UserLockoutSummaryModalController
     *
     * @description
     * Controller for the unlock summary modal. Shows three expandable sections - successfully
     * unlocked, not found and failed - each with its user count in the header. All sections
     * start collapsed; clicking one expands it to reveal a table of that outcome's users.
     * Cached usernames from the table are shown when available, otherwise the raw id.
     */
    angular
        .module('admin-user-lockouts')
        .controller('UserLockoutSummaryModalController', controller);

    controller.$inject = ['summary', 'usernamesById', 'modalDeferred'];

    function controller(summary, usernamesById, modalDeferred) {

        var vm = this;

        vm.$onInit = onInit;
        vm.toggle = toggle;
        vm.isExpanded = isExpanded;
        vm.close = close;

        function onInit() {
            vm.sections = [
                {
                    key: 'unlocked',
                    label: 'adminUserLockouts.summary.unlocked',
                    users: toUsers(summary.unlocked)
                },
                {
                    key: 'notFound',
                    label: 'adminUserLockouts.summary.notFound',
                    users: toUsers(summary.notFound)
                },
                {
                    key: 'failed',
                    label: 'adminUserLockouts.summary.failed',
                    users: toUsers(summary.failed)
                }
            ];

            // All sections collapsed by default.
            vm.expanded = {};
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-lockouts.controller:UserLockoutSummaryModalController
         * @name toggle
         *
         * @description
         * Expands or collapses the section with the given key.
         *
         * @param {String} key the section key
         */
        function toggle(key) {
            vm.expanded[key] = !vm.expanded[key];
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-lockouts.controller:UserLockoutSummaryModalController
         * @name isExpanded
         *
         * @param {String} key the section key
         * @return {Boolean} whether the section is currently expanded
         */
        function isExpanded(key) {
            return !!vm.expanded[key];
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-lockouts.controller:UserLockoutSummaryModalController
         * @name close
         *
         * @description
         * Closes the modal.
         */
        function close() {
            modalDeferred.resolve();
        }

        function toUsers(ids) {
            return (ids || []).map(function(id) {
                return {
                    id: id,
                    username: usernamesById[id]
                };
            });
        }
    }

})();
