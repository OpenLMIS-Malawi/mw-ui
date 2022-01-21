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

    angular.module('admin-valid-source-list').config(routes);

    routes.$inject = ['$stateProvider', 'ADMINISTRATION_RIGHTS'];

    function routes($stateProvider, ADMINISTRATION_RIGHTS) {

        $stateProvider.state('openlmis.administration.validSource', {
            showInNavigation: true,
            label: 'adminValidSourceList.validSources',
            url: '/validSources?page&size&programId&facilityId&storageKey',
            controller: 'ValidSourceListController',
            templateUrl: 'admin-valid-source-list/valid-source-list.html',
            controllerAs: 'vm',
            accessRights: [ADMINISTRATION_RIGHTS.STOCK_SOURCES_MANAGE],
            resolve: {
                validSourcesData: function(paginationService, ValidSourceResource, $stateParams) {
                    return paginationService.registerUrl($stateParams, function(params) {
                        return new ValidSourceResource().query({
                            size: params.size,
                            page: params.page,
                            programId: params.programId,
                            facilityId: params.facilityId
                        });
                    });
                },
                facilities: function(FacilityResource) {
                    return new FacilityResource().query()
                        .then(function(response) {
                            return response.content;
                        });
                },
                facilitiesById: function(facilities) {
                    var result = [];

                    angular.forEach(facilities, function(value) {
                        result[value.id] = value;
                    });

                    return result;
                },
                validSources: function(validSourcesData, FacilityResource, facilitiesById) {
                    var result = [];

                    angular.forEach(validSourcesData, function(validSource) {
                        var item = {
                            programId: validSource.programId,
                            facilityTypeId: validSource.facilityTypeId,
                            name: validSource.name,
                            id: validSource.id
                        };

                        if (validSource.node.refDataFacility) {
                            var id = validSource.node.referenceId;
                            item.geoZoneId = facilitiesById[id].geographicZone.id;
                            item.geoLevelId = facilitiesById[id].geographicZone.level.id;
                        }

                        result.push(item);
                    });

                    return result;
                },
                programs: function(programService) {
                    return programService.getAll();
                },
                facilityTypes: function(facilityTypeService) {
                    return facilityTypeService.query({
                        active: true
                    })
                        .then(function(response) {
                            return response.content;
                        });
                },
                facilityTypesMap: function(facilityTypes, ObjectMapper) {
                    return new ObjectMapper().map(facilityTypes, 'name');
                },
                programsMap: function(programs, ObjectMapper) {
                    return new ObjectMapper().map(programs, 'name');
                },
                geographicZones: function($q, geographicZoneService) {
                    var deferred = $q.defer();

                    geographicZoneService.getAll().then(function(response) {
                        deferred.resolve(response.content);
                    }, deferred.reject);

                    return deferred.promise;
                },
                geographicZonesMap: function(geographicZones, ObjectMapper) {
                    return new ObjectMapper().map(geographicZones, 'name');
                },
                geographicLevelMap: function(geographicZones) {
                    var levels = [];

                    angular.forEach(geographicZones, function(zone) {
                        levels[zone.level.id] = zone.level.name;
                    });

                    return levels;
                }
            }
        });
    }
})();