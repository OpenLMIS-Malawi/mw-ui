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
     * @name admin-user-lockouts.userLockoutSelectionService
     *
     * @description
     * Holds the set of users selected for unlocking. Kept as a singleton (outside the
     * controller) so the selection survives the state reloads triggered by pagination -
     * edits made on previous pages remain in memory.
     */
    angular
        .module('admin-user-lockouts')
        .service('userLockoutSelectionService', service);

    function service() {

        var selected = {};

        this.set = set;
        this.isSelected = isSelected;
        this.getSelected = getSelected;
        this.getSelectedIds = getSelectedIds;
        this.getUsernamesById = getUsernamesById;
        this.count = count;
        this.clear = clear;

        /**
         * @ngdoc method
         * @methodOf admin-user-lockouts.userLockoutSelectionService
         * @name set
         *
         * @description
         * Adds the user to the selection when isSelected is true, removes it otherwise.
         *
         * @param {Object}  user       the user to set (must have id and username)
         * @param {Boolean} isSelected the desired selection state
         */
        function set(user, isSelected) {
            if (isSelected) {
                selected[user.id] = {
                    id: user.id,
                    username: user.username
                };
            } else {
                delete selected[user.id];
            }
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-lockouts.userLockoutSelectionService
         * @name isSelected
         *
         * @param {String} id the user id
         * @return {Boolean} true if the user is currently selected
         */
        function isSelected(id) {
            return !!selected[id];
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-lockouts.userLockoutSelectionService
         * @name getSelected
         *
         * @return {Array} the selected users as {id, username} objects
         */
        function getSelected() {
            return Object.keys(selected).map(function(id) {
                return selected[id];
            });
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-lockouts.userLockoutSelectionService
         * @name getSelectedIds
         *
         * @return {Array} the selected user ids
         */
        function getSelectedIds() {
            return Object.keys(selected);
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-lockouts.userLockoutSelectionService
         * @name getUsernamesById
         *
         * @description
         * Returns a map of id -> username for every user the table has shown and that has
         * been selected, used by the summary modal to resolve ids returned by the API back
         * to human-readable usernames.
         *
         * @return {Object} map of user id to username
         */
        function getUsernamesById() {
            var map = {};
            Object.keys(selected).forEach(function(id) {
                map[id] = selected[id].username;
            });
            return map;
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-lockouts.userLockoutSelectionService
         * @name count
         *
         * @return {Number} the number of selected users
         */
        function count() {
            return Object.keys(selected).length;
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-lockouts.userLockoutSelectionService
         * @name clear
         *
         * @description
         * Empties the selection.
         */
        function clear() {
            selected = {};
        }
    }

})();
