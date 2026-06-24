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
     * @name admin-user-lockouts.userLockoutService
     *
     * @description
     * Talks to the auth service bulk-unlock endpoint.
     */
    angular
        .module('admin-user-lockouts')
        .service('userLockoutService', service);

    service.$inject = ['$http', 'openlmisUrlFactory'];

    function service($http, openlmisUrlFactory) {

        this.unlock = unlock;

        /**
         * @ngdoc method
         * @methodOf admin-user-lockouts.userLockoutService
         * @name unlock
         *
         * @description
         * Unlocks the given users in a single request.
         *
         * @param  {Array}   ids the ids of the users to unlock
         * @return {Promise}     resolves with the {unlocked, notFound, failed} response,
         *                       each being a list of user ids
         */
        function unlock(ids) {
            return $http.post(openlmisUrlFactory('/api/users/auth/unlock'), ids)
                .then(function(response) {
                    return response.data;
                });
        }
    }

})();
