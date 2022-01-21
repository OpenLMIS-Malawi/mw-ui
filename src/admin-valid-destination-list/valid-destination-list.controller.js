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
     * @name admin-valid-destination-list.controller:ValidDestinationListController
     *
     * @description
     * Controller for managing valid destinations list screen.
     */
    angular
        .module('admin-valid-destination-list')
        .controller('ValidDestinationListController', controller);

    controller.$inject = [
        'ValidDestinationResource', 'stateTrackerService', 'validDestinations', 'facilityTypesMap', 'programsMap',
        'geographicZonesMap', 'geographicLevelMap', 'programs', 'facilities', '$stateParams', '$state',
        'UuidGenerator', '$window', 'confirmService', 'loadingModalService', 'notificationService', '$q'
    ];

    function controller(ValidDestinationResource, stateTrackerService, validDestinations, facilityTypesMap,
                        programsMap, geographicZonesMap, geographicLevelMap, programs,
                        facilities, $stateParams, $state, UuidGenerator,
                        $window, confirmService, loadingModalService, notificationService, $q) {

        var vm = this,
            uuidGenerator = new UuidGenerator();

        vm.$onInit = onInit;
        vm.search = search;
        vm.onValidDestinationSelect = onValidDestinationSelect;
        vm.toggleSelectAll = toggleSelectAll;
        vm.setSelectAll = setSelectAll;
        vm.getSelected = getSelected;
        vm.deleteSelectedValidDestinations = deleteSelectedValidDestinations;
        vm.$window = $window;
        vm.goToPreviousState = stateTrackerService.goToPreviousState;

        /**
         * @ngdoc method
         * @methodOf admin-valid-destination-list.controller:ValidDestinationListController
         * @name search
         *
         * @description
         * Reloads page with new search parameters.
         */
        function search() {
            var stateParams = angular.copy($stateParams);

            stateParams.programId = vm.programId;
            stateParams.facilityId = vm.facilityId;

            $state.go('openlmis.administration.validDestination', stateParams, {
                reload: true
            });
        }

        /**
         * @ngdoc property
         * @propertyOf admin-valid-destination-list.controller:ValidDestinationListController
         * @name facilityId
         * @type {String}
         *
         * @description
         * Id of facility selected in for filtering
         */
        vm.facilityId = $stateParams.facilityId;

        /**
         * @ngdoc property
         * @propertyOf admin-valid-destination-list.controller:ValidDestinationListController
         * @name programId
         * @type {String}
         *
         * @description
         * Id of program selected in for filtering
         */
        vm.programId = $stateParams.programId;

        /**
         * @ngdoc property
         * @propertyOf admin-valid-destination-list.controller:ValidDestinationListController
         * @name validDestinations
         * @type {Array}
         *
         * @description
         * Contains filtered validDestinations.
         */
        vm.validDestinations = validDestinations;

        /**
         * @ngdoc property
         * @propertyOf admin-valid-destination-list.controller:ValidDestinationListController
         * @name facilities
         * @type {Array}
         *
         * @description
         * Facilities available for filtering
         */
        vm.facilities = facilities;

        /**
         * @ngdoc property
         * @propertyOf admin-valid-destination-list.controller:ValidDestinationListController
         * @name programs
         * @type {Array}
         *
         * @description
         * Programs available for filtering
         */
        vm.programs = programs;

        /**
         * @ngdoc property
         * @propertyOf admin-valid-destination-list.controller:ValidDestinationListController
         * @type {Array}
         * @name facilityTypesMap
         *
         * @description
         * The map of facility type names by ids.
         */
        vm.facilityTypesMap = facilityTypesMap;

        /**
           * @ngdoc property
           * @propertyOf admin-valid-destination-list.controller:ValidDestinationListController
           * @type {Object}
           * @name programsMap
           *
           * @description
           * The map of program names by ids.
           */
        vm.programsMap = programsMap;

        /**
           * @ngdoc property
           * @propertyOf admin-valid-destination-list.controller:ValidDestinationListController
           * @type {Object}
           * @name geographicZonesMap
           *
           * @description
           * The map of geographic zones names by ids.
           */
        vm.geographicZonesMap = geographicZonesMap;

        /**
         * @ngdoc property
         * @propertyOf admin-valid-destination-list.controller:ValidDestinationListController
         * @type {Array}
         * @name geographicLevelMap
         *
         * @description
         * The map of geographic levels zones names by ids.
         */
        vm.geographicLevelMap = geographicLevelMap;

        /**
         * @ngdoc property
         * @propertyOf admin-valid-destination-list.controller:ValidDestinationListController
         * @name selectAll
         * @type {Boolean}
         *
         * @description
         * Indicates if all valid destinations from list all selected or not.
         */
        vm.selectAll = false;

        /**
         * @ngdoc method
         * @methodOf admin-valid-destination-list.controller:ValidDestinationListController
         * @name getSelected
         *
         * @description
         * Returns a list of valid destinations selected by user, that are supposed to be converted to
         *     orders.
         *
         * @return {Array} list of selected valid destinations
         */
        function getSelected() {
            var storageSelected = $window.sessionStorage.getItem(vm.selectedValidDestinationsStorageKey);

            storageSelected = storageSelected ? JSON.parse(storageSelected) : {};

            var selected = [];

            for (var id in storageSelected) {
                if (storageSelected.hasOwnProperty(id)) {
                    selected.push(storageSelected[id]);
                }
            }

            angular.forEach(vm.validDestinations, function(validDestination) {
                if (validDestination.$selected && storageSelected[validDestination.id] === undefined) {
                    selected.push(validDestination);
                }
            });

            return selected;
        }

        /**
         * @ngdoc method
         * @propertyOf admin-valid-destination-list.controller:ValidDestinationListController
         * @name openAddValidDestinationModal
         *
         * @description
         * Takes the user to the add facility page.
         */
        vm.openAddValidDestinationModal = function() {
            $state.go('openlmis.administration.validDestination.add');
        };

        /**
         * @ngdoc method
         * @methodOf admin-valid-destination-list.controller:ValidDestinationListController
         * @name toggleSelectAll
         *
         * @description
         * Responsible for marking/unmarking all valid destinations as selected.
         *
         * @param {Boolean} selectAll Determines if all valid destinations should be selected or not
         */
        function toggleSelectAll(selectAll) {
            angular.forEach(vm.validDestinations, function(validDestination) {
                validDestination.$selected = selectAll;
                vm.onValidDestinationSelect(validDestination);
            });
        }

        /**
         * @ngdoc method
         * @methodOf admin-valid-destination-list.controller:ValidDestinationListController
         * @name setSelectAll
         *
         * @description
         * Responsible for making the checkbox "select all" checked when all valid destinations are
         *     selected by user.
         */
        function setSelectAll() {
            var value = true;
            angular.forEach(vm.validDestinations, function(validDestination) {
                value = value && validDestination.$selected;
            });
            vm.selectAll = value;
        }

        /**
         * @ngdoc method
         * @methodOf admin-valid-destination-list.controller:ValidDestinationListController
         * @name loadPreviouslySelectedValidDestinations
         *
         * @description
         * Selects checkboxes on current page if checked before
         */
        function loadPreviouslySelectedValidDestinations() {
            var storageValidDestinations = $window.sessionStorage.getItem(vm.selectedValidDestinationsStorageKey);
            storageValidDestinations = storageValidDestinations ? JSON.parse(storageValidDestinations) : {};

            for (var i = 0; i < vm.validDestinations.length; i++) {
                var vs = vm.validDestinations[i];

                if (storageValidDestinations[vs.id] !== undefined) {
                    vm.validDestinations[i].$selected = true;
                }
            }

            setSelectAll();
        }

        /**
         * @ngdoc method
         * @methodOf admin-valid-destination-list.controller:ValidDestinationListController
         * @name onValidDestinationSelect
         *
         * @description
         * Syncs valid destination selection with storage
         */
        function onValidDestinationSelect(validDestination) {
            var storageValidDestinations = $window.sessionStorage.getItem(vm.selectedValidDestinationsStorageKey);

            storageValidDestinations = storageValidDestinations ? JSON.parse(storageValidDestinations) : {};

            var validDestinationId = validDestination.id;

            if (validDestination.$selected) {
                storageValidDestinations[validDestinationId] = validDestination;
            } else {
                delete storageValidDestinations[validDestinationId];
            }

            $window.sessionStorage.setItem(
                vm.selectedValidDestinationsStorageKey, JSON.stringify(storageValidDestinations)
            );

            setSelectAll();
        }

        /**
         * @ngdoc method
         * @methodOf admin-valid-destination-list.controller:ValidDestinationListController
         * @name $onInit
         *
         * @description
         * Method that is executed on initiating ValidDestinationListController.
         */
        function onInit() {
            if ($stateParams.storageKey === undefined) {
                $stateParams.storageKey = uuidGenerator.generate();
                $state.go($state.current.name, $stateParams, {
                    reload: false,
                    notify: false
                });
            }

            vm.selectedValidDestinationsStorageKey = 'admin-valid-destination-list/selected-valid-sources/'
                + $stateParams.storageKey;

            loadPreviouslySelectedValidDestinations();
        }

        function deleteSelectedValidDestinations() {
            var validDestinations = getSelected();

            if (validDestinations.length > 0) {
                confirmService
                    .confirm('adminValidDestinationList.delete.confirm', 'adminValidDestinationList.delete')
                    .then(function() {
                        loadingModalService.open();
                        angular.forEach(validDestinations, function(validDestination) {
                            return new ValidDestinationResource().delete(validDestination);
                        });
                    })
                    .then(function() {
                        vm.goToPreviousState();
                    })
                    .then(function() {
                        notificationService.success('adminValidDestinationList.validDestinationDeletedSuccessfully');
                    })
                    .catch(function(error) {
                        loadingModalService.close();
                        notificationService.error('adminValidDestinationList.failure');
                        return $q.reject(error);
                    })
                    .finally(function() {
                        loadingModalService.close();
                        $window.sessionStorage.removeItem('admin-valid-destination-list/selected-valid-sources/'
                        + $stateParams.storageKey);
                        $state.go($state.current.name, $stateParams, {
                            reload: true
                        });
                    });
            } else {
                notificationService.error('adminValidDestinationList.selectAtLeastOneValidDestination');
            }
        }
    }
})();