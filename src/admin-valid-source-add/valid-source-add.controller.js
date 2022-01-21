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
     * @name admin-valid-source-add.controller:ValidSourceAddController
     *
     * @description
     * Controls Add Valid Source modal.
     */
    angular
        .module('admin-valid-source-add')
        .controller('ValidSourceAddController', ValidSourceAddController);

    ValidSourceAddController.$inject = [
        'ValidSourceResource',
        'stateTrackerService',
        'loadingModalService',
        'notificationService',
        'programs',
        'facilities',
        'organizations',
        'facilityTypes',
        'geoLevels'
    ];

    function ValidSourceAddController(
        ValidSourceResource,
        stateTrackerService,
        loadingModalService,
        notificationService,
        programs,
        facilities,
        organizations,
        facilityTypes,
        geoLevels
    ) {
        var vm = this;

        /**
         * @ngdoc property
         * @propertyOf admin-valid-source-list.controller:ValidSourceListController
         * @type {ValidSourceResource}
         * @name validSourceResource
         *
         * @description
         * Resource for handling valid sources
         */
        vm.validSourceResource = null;

        /**
         * @ngdoc property
         * @propertyOf admin-valid-source-list.controller:ValidSourceListController
         * @type {Array}
         * @name programs
         *
         * @description
         * Available programs
         */
        vm.programs = [];

        /**
         * @ngdoc property
         * @propertyOf admin-valid-source-list.controller:ValidSourceListController
         * @type {Array}
         * @name unitType
         *
         * @description
         * Available facilities
         */
        vm.facilities = [];

        /**
         * @ngdoc property
         * @propertyOf admin-valid-source-list.controller:ValidSourceListController
         * @type {Array}
         * @name unitType
         *
         * @description
         * Available facilities
         */
        vm.facilityTypes = [];

        /**
         * @ngdoc property
         * @propertyOf admin-valid-source-list.controller:ValidSourceListController
         * @type {Array}
         * @name geoLevels
         *
         * @description
         * Available facilities
         */
        vm.geoLevels = [];

        /**
         * @ngdoc property
         * @propertyOf admin-valid-source-list.controller:ValidSourceListController
         * @type {Array}
         * @name organizations
         *
         * @description
         * Available organizations
         */
        vm.organizations = [];

        /**
         * @ngdoc property
         * @propertyOf admin-valid-source-list.controller:ValidSourceListController
         * @type {Object}
         * @name unitType
         *
         * @description
         * Selected program
         */
        vm.program = null;

        /**
         * @ngdoc property
         * @propertyOf admin-valid-source-list.controller:ValidSourceListController
         * @type {String}
         * @name unitType
         *
         * @description
         * Selected unit type - organization or facility
         */
        vm.unitType = 'facility';

        /**
         * @ngdoc property
         * @propertyOf admin-valid-source-list.controller:ValidSourceListController
         * @type {Object}
         * @name facility
         *
         * @description
         * Selected facility
         */
        vm.facility = null;

        /**
         * @ngdoc property
         * @propertyOf admin-valid-source-list.controller:ValidSourceListController
         * @type {Object}
         * @name organization
         *
         * @description
         * Selected organization
         */
        vm.organization = null;

        /**
         * @ngdoc property
         * @propertyOf admin-valid-source-list.controller:ValidSourceListController
         * @type {Object}
         * @name geoLevel
         *
         * @description
         * Selected geographic zone level
         */
        vm.geoLevel = null;

        /**
         * @ngdoc property
         * @propertyOf admin-valid-source-list.controller:ValidSourceListController
         * @type {Object}
         * @name facilityType
         *
         * @description
         * Selected facility type
         */
        vm.facilityType = null;

        /**
         * @ngdoc method
         * @methodOf admin-valid-source-add.controller:ValidSourceAddController
         * @name $onInit
         *
         * @description
         * Initialization method of the ValidSourceAddController.
         */
        vm.$onInit = function() {
            vm.programs = programs;
            vm.facilities = facilities;
            vm.organizations = organizations;
            vm.validSourceResource = new ValidSourceResource();
            vm.facilityTypes = facilityTypes;
            vm.geoLevels = geoLevels;
        };

        /**
         * @ngdoc method
         * @methodOf admin-valid-source-add.controller:ValidSourceAddController
         * @name goToPreviousState
         *
         * @description
         * Helper for using previous state from view layer
         */
        vm.goToPreviousState = stateTrackerService.goToPreviousState;

        /**
         * @ngdoc method
         * @methodOf admin-valid-source-add.controller:ValidSourceAddController
         * @name submit
         *
         * @description
         * Submits form
         */
        vm.submit = function() {
            var isRefDataFacility = vm.unitType === 'facility';
            var referenceId = isRefDataFacility ? vm.facility.id : vm.organization.id;

            var payload = {
                programId: vm.program.id,
                facilityTypeId: vm.facilityType.id,
                node: {
                    referenceId: referenceId
                }
            };

            if (vm.geoLevel !== null) {
                payload.geoLevelAffinityId = vm.geoLevel.id;
            }

            loadingModalService.open();
            return vm.validSourceResource.create(payload)
                .then(function(validSource) {
                    notificationService.success('adminValidSourceAdd.validSourceAddedSuccessfully');
                    loadingModalService.close();
                    vm.goToPreviousState();
                    return validSource;
                })
                .catch(function() {
                    notificationService.error('adminValidSourceAdd.failure');
                    loadingModalService.close();
                });
        };
    }
})();