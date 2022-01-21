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

    angular
        .module('admin-valid-destination-add')
        .config(routes);

    routes.$inject = ['modalStateProvider', 'ADMINISTRATION_RIGHTS'];

    function routes(modalStateProvider, ADMINISTRATION_RIGHTS) {

        modalStateProvider.state('openlmis.administration.validDestination.add', {
            controller: 'ValidDestinationAddController',
            controllerAs: 'vm',
            accessRights: [ADMINISTRATION_RIGHTS.STOCK_DESTINATIONS_MANAGE],
            templateUrl: 'admin-valid-destination-add/valid-destination-add.html',
            url: '/add',
            resolve: {
                organizations: organizationsResolve,
                geoLevels: geoLevelsResolve
            },
            parentResolves: [
                'facilities',
                'facilityTypes',
                'geographicLevelMap',
                'programs'
            ]
        });

        geoLevelsResolve.$inject = ['GeoLevelResource'];

        function geoLevelsResolve(GeoLevelResource) {
            return new GeoLevelResource().query()
                .then(function(resource) {
                    return resource.content;
                });
        }

        organizationsResolve.$inject = ['OrganizationResource'];

        function organizationsResolve(OrganizationResource) {
            return new OrganizationResource().query()
                .then(function(resource) {
                    return resource.content;
                });
        }
    }
})();
