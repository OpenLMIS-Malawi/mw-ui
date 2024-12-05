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
     * @name referencedata-facilities-cache.facilityService
     *
     * @description
     * Decorates methods to the facilityService, making it so the minimal
     * facility list is loaded once.
     */
    angular
        .module('referencedata-facilities-cache')
        .config(config);

    config.$inject = ['$provide'];

    function config($provide) {
        $provide.decorator('facilityService', decorator);
    }

    decorator.$inject = ['$delegate', '$q', 'LocalDatabase', 'offlineService'];

    function decorator($delegate, $q, LocalDatabase, offlineService) {
        var originalGetAllMinimal = $delegate.getAllMinimal,
            minimalFacilitiesDatabase =
                new LocalDatabase('minimalFacilities', 'referencedataFacilitiesCache.offlineMessage'),
            cached = false,
            promise;

        $delegate.cacheAllMinimal = cacheAllMinimal;
        $delegate.getAllMinimal = getAllMinimal;
        $delegate.getMinimal = getMinimal;
        $delegate.clearMinimalFacilitiesCache = clearCache;
        // MW-1368: Added cacheMinimal
        $delegate.cacheMinimal = cacheMinimal;
        // MW-1368: ends here

        return $delegate;

        /**
         * @ngdoc method
         * @methodOf referencedata-facilities-cache.facilityService
         * @name getAllMinimal
         *
         * @description
         * Gets a minimal representation of all facilities from the referencedata service, which is then stored and only
         * retrieved from the user's browser. Calling this method will cache all the minimal facility representations
         * if they are not already cached.
         */
        function getAllMinimal() {
            return this.cacheAllMinimal()
                .then(function() {
                    return minimalFacilitiesDatabase.getAll();
                });
        }

        /**
         * @ngdoc method
         * @methodOf referencedata-facilities-cache.facilityService
         * @name getAllMinimal
         *
         * @description
         * Caches all the minimal facility representations if they are not already cached. Resolves immediately if they
         * are already cached. If caching fails, calling this method again will reattempt caching. 
         * 
         * @return {Promise}  the promise resolved when caching is done, it does not resolve to a list of cached
         *                    minimal facilities
         */
        function cacheAllMinimal() {
            if (cached) {
                return $q.resolve();
            }
            if (offlineService.isOffline()) {
                return minimalFacilitiesDatabase.getAll();
            }
            if (!promise) {
                promise = originalGetAllMinimal.apply($delegate, arguments)
                    .then(function(facilities) {
                        return refreshDb(facilities, minimalFacilitiesDatabase);
                    })
                    .then(function() {
                        cached = true;
                    })
                    .finally(function() {
                        promise = undefined;
                    });
            }
            return promise;
        }

        /**
         * @ngdoc method
         * @methodOf referencedata-facilities-cache.facilityService
         * @name clearMinimalFacilitiesDatabase
         *
         * @description
         * Deletes any facilities stored in the user's browser cache.
         */
        function clearCache() {
            return minimalFacilitiesDatabase.removeAll()
                .then(function() {
                    promise = undefined;
                    cached = false;
                });
        }

        /**
         * @ngdoc method
         * @methodOf referencedata-facilities-cache.facilityService
         * @name getMinimal
         *
         * @description
         * Gets a minimal representation of single facility by id field. Calling this method will cache all the minimal
         * facility representations if they are not already cached.
         *
         * @param  {String} facility ID
         * @return {Object} found facility object
         */
        function getMinimal(id) {
            return this.cacheAllMinimal()
                .then(function() {
                    return minimalFacilitiesDatabase.get(id);
                });
        }

        // MW-1368: Added cacheMinimal function
        /**
         * @ngdoc method
         * @methodOf referencedata-facilities-cache.facilityService
         * @name getMinimal
         *
         * @description
         * Cached minimal Facility
         *
         * @param {Object} facility object
         */
        function cacheMinimal(facility) {
            var facilityMinimal = {
                id: facility.id,
                code: facility.code,
                name: facility.name,
                active: facility.active
            }
            return minimalFacilitiesDatabase.put(facilityMinimal);
        }
        // MW-1368: ends here
    }

    function refreshDb(facilities, minimalFacilitiesDatabase) {
        return minimalFacilitiesDatabase.removeAll()
            .then(function() {
                return minimalFacilitiesDatabase.putAll(facilities);
            });
    }

})();
