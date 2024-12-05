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
     * @name openlmis-facility-program-select.facilityProgramCacheService
     *
     * @description
     * Service responsible for retrieving cached data for openlmis-facility-program-select component.
     */
    angular
        .module('openlmis-facility-program-select')
        .service('facilityProgramCacheService', service);

    service.$inject = [
        '$q', 'programService', 'authorizationService', 'facilityService', 'currentUserService',
        'permissionService'
    ];

    function service($q, programService, authorizationService, facilityService, currentUserService,
                     permissionService) {

        var modulesWithRights = {},
            facilities = [],
            programs = [],
            permissions = [],
            rights = [],
            homeFacility;

        this.loadData = loadData;
        this.getUserHomeFacility = getUserHomeFacility;
        this.getUserPrograms = getUserPrograms;
        this.getSupervisedFacilities = getSupervisedFacilities;
        this.pushRightsForModule = pushRightsForModule;

        /**
         * @ngdoc method
         * @methodOf openlmis-facility-program-select.facilityProgramCacheService
         * @name getUserHomeFacility
         *
         * @description
         * Returns cached minimal representation of user home facility.
         *
         * @return {Object} user home facility
         */
        function getUserHomeFacility() {
            return homeFacility;
        }

        /**
         * @ngdoc method
         * @methodOf openlmis-facility-program-select.facilityProgramCacheService
         * @name getUserPrograms
         *
         * @description
         * Returns all cached user programs.
         *
         * @param  {Boolean} isSupervised if programs are for supervised facilities
         * @return {Array}                user supervised programs
         */
        function getUserPrograms(isSupervised) {
            var programIds = [];
            if (isSupervised) {
                permissions.forEach(function(permission) {
                    if (rights.indexOf(permission.right) !== -1 &&
                        (!homeFacility || (homeFacility && homeFacility.id !== permission.facilityId))) {
                        programIds.push(permission.programId);
                    }
                });
            } else {
                if (!homeFacility) {
                    return [];
                }

                permissions.forEach(function(permission) {
                    if (rights.indexOf(permission.right) !== -1 && homeFacility.id === permission.facilityId) {
                        programIds.push(permission.programId);
                    }
                });
            }

            var result = [];
            programs.forEach(function(program) {
                if (programIds.indexOf(program.id) !== -1) {
                    result.push(program);
                }
            });
            return result;
        }

        /**
         * @ngdoc method
         * @methodOf openlmis-facility-program-select.facilityProgramCacheService
         * @name getSupervisedFacilities
         *
         * @description
         * Returns all active cached user supervised facilities
         * filtered by program and rights stored for current module.
         *
         * @param  {String} programId  program id for filtering
         * @return {Array}             user supervised facilities
         */
        function getSupervisedFacilities(programId) {
            var facilityIds = [];
            permissions.forEach(function(permission) {
                if (rights.indexOf(permission.right) !== -1 && programId === permission.programId) {
                    facilityIds.push(permission.facilityId);
                }
            });

            var result = [];
            facilities.forEach(function(facility) {
                // MW-1368: Added a condition to return only active facilities
                if (facilityIds.indexOf(facility.id) !== -1 && facility.active) {
                    // MW-1368: ends here
                    result.push(facility);
                }
            });
            return result;
        }

        /**
         * @ngdoc method
         * @methodOf openlmis-facility-program-select.facilityProgramCacheService
         * @name pushRightsForModule
         *
         * @description
         * Module can load set of rights that will be used to fetch supervised facilities.
         *
         * @param {String} moduleName name that will be used to get specified rights
         * @param {Array}  rightArray array of rights
         */
        function pushRightsForModule(moduleName, rightArray) {
            modulesWithRights[moduleName] = rightArray;
        }

        /**
         * @ngdoc method
         * @methodOf openlmis-facility-program-select.facilityProgramCacheService
         * @name loadData
         *
         * @description
         * Loads all cached data for this module, like facilities, programs and permission strings.
         * It have to be called before using other methods except pushRightsForModule.
         *
         * @param  {String}  moduleName name of current module
         * @return {Promise}            promise that resolves after successful load
         */
        function loadData(moduleName) {
            var userId = authorizationService.getUser().user_id;

            return $q.all([
                facilityService.getAllMinimal(),
                programService.getUserPrograms(userId),
                permissionService.load(userId),
                currentUserService.getUserInfo()
            ])
                .then(function(responses) {
                    facilities = responses[0];
                    programs = responses[1];
                    permissions = responses[2];

                    loadRights(moduleName);

                    var currentUserDetails = responses[3];
                    homeFacility = getFacilityById(currentUserDetails.homeFacilityId);
                });
        }

        function getFacilityById(id) {
            return facilities.filter(function(facility) {
                return facility.id === id;
            })[0];
        }

        function loadRights(moduleName) {
            if (modulesWithRights[moduleName]) {
                rights = modulesWithRights[moduleName];
            }
        }
    }

})();
