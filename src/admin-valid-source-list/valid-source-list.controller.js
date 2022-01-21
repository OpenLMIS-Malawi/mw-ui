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
     * @name admin-valid-source-list.controller:ValidSourceListController
     *
     * @description
     * Controller for managing valid sources list screen.
     */
    angular
        .module('admin-valid-source-list')
        .controller('ValidSourceListController', controller);

    controller.$inject = [
        'ValidSourceResource', 'stateTrackerService', 'validSources', 'facilityTypesMap', 'programsMap',
        'geographicZonesMap', 'geographicLevelMap', 'programs', 'facilities', '$stateParams', '$state',
        'UuidGenerator', '$window', 'confirmService', 'loadingModalService', 'notificationService', '$q'
    ];

    function controller(ValidSourceResource, stateTrackerService, validSources, facilityTypesMap,
                        programsMap, geographicZonesMap, geographicLevelMap, programs,
                        facilities, $stateParams, $state, UuidGenerator,
                        $window, confirmService, loadingModalService, notificationService, $q) {

        var vm = this,
            uuidGenerator = new UuidGenerator();

        vm.$onInit = onInit;
        vm.search = search;
        vm.onValidSourceSelect = onValidSourceSelect;
        vm.toggleSelectAll = toggleSelectAll;
        vm.setSelectAll = setSelectAll;
        vm.getSelected = getSelected;
        vm.deleteSelectedValidSources = deleteSelectedValidSources;
        vm.$window = $window;
        vm.goToPreviousState = stateTrackerService.goToPreviousState;

        /**
         * @ngdoc method
         * @methodOf admin-valid-source-list.controller:ValidSourceListController
         * @name search
         *
         * @description
         * Reloads page with new search parameters.
         */
        function search() {
            var stateParams = angular.copy($stateParams);

            stateParams.programId = vm.programId;
            stateParams.facilityId = vm.facilityId;

            $state.go('openlmis.administration.validSource', stateParams, {
                reload: true
            });
        }

        /**
         * @ngdoc property
         * @propertyOf admin-valid-source-list.controller:ValidSourceListController
         * @name facilityId
         * @type {String}
         *
         * @description
         * Id of facility selected in for filtering
         */
        vm.facilityId = $stateParams.facilityId;

        /**
         * @ngdoc property
         * @propertyOf admin-valid-source-list.controller:ValidSourceListController
         * @name programId
         * @type {String}
         *
         * @description
         * Id of program selected in for filtering
         */
        vm.programId = $stateParams.programId;

        /**
         * @ngdoc property
         * @propertyOf admin-valid-source-list.controller:ValidSourceListController
         * @name validSources
         * @type {Array}
         *
         * @description
         * Contains filtered validSources.
         */
        vm.validSources = validSources;

        /**
         * @ngdoc property
         * @propertyOf admin-valid-source-list.controller:ValidSourceListController
         * @name facilities
         * @type {Array}
         *
         * @description
         * Facilities available for filtering
         */
        vm.facilities = facilities;

        /**
         * @ngdoc property
         * @propertyOf admin-valid-source-list.controller:ValidSourceListController
         * @name programs
         * @type {Array}
         *
         * @description
         * Programs available for filtering
         */
        vm.programs = programs;

        /**
         * @ngdoc property
         * @propertyOf admin-valid-source-list.controller:ValidSourceListController
         * @type {Array}
         * @name facilityTypesMap
         *
         * @description
         * The map of facility type names by ids.
         */
        vm.facilityTypesMap = facilityTypesMap;

        /**
           * @ngdoc property
           * @propertyOf admin-valid-source-list.controller:ValidSourceListController
           * @type {Object}
           * @name programsMap
           *
           * @description
           * The map of program names by ids.
           */
        vm.programsMap = programsMap;

        /**
           * @ngdoc property
           * @propertyOf admin-valid-source-list.controller:ValidSourceListController
           * @type {Object}
           * @name geographicZonesMap
           *
           * @description
           * The map of geographic zones names by ids.
           */
        vm.geographicZonesMap = geographicZonesMap;

        /**
         * @ngdoc property
         * @propertyOf admin-valid-source-list.controller:ValidSourceListController
         * @type {Array}
         * @name geographicLevelMap
         *
         * @description
         * The map of geographic levels zones names by ids.
         */
        vm.geographicLevelMap = geographicLevelMap;

        /**
         * @ngdoc property
         * @propertyOf admin-valid-source-list.controller:ValidSourceListController
         * @name selectAll
         * @type {Boolean}
         *
         * @description
         * Indicates if all valid sources from list all selected or not.
         */
        vm.selectAll = false;

        /**
         * @ngdoc method
         * @methodOf admin-valid-source-list.controller:ValidSourceListController
         * @name getSelected
         *
         * @description
         * Returns a list of valid sources selected by user, that are supposed to be converted to
         *     orders.
         *
         * @return {Array} list of selected valid sources
         */
        function getSelected() {
            var storageSelected = $window.sessionStorage.getItem(vm.selectedValidSourcesStorageKey);

            storageSelected = storageSelected ? JSON.parse(storageSelected) : {};

            var selected = [];

            for (var id in storageSelected) {
                if (storageSelected.hasOwnProperty(id)) {
                    selected.push(storageSelected[id]);
                }
            }

            angular.forEach(vm.validSources, function(validSource) {
                if (validSource.$selected && storageSelected[validSource.id] === undefined) {
                    selected.push(validSource);
                }
            });

            return selected;
        }

        /**
         * @ngdoc method
         * @propertyOf admin-valid-source-list.controller:ValidSourceListController
         * @name openAddValidSourceModal
         *
         * @description
         * Takes the user to the add facility page.
         */
        vm.openAddValidSourceModal = function() {
            $state.go('openlmis.administration.validSource.add');
        };

        /**
         * @ngdoc method
         * @methodOf admin-valid-source-list.controller:ValidSourceListController
         * @name toggleSelectAll
         *
         * @description
         * Responsible for marking/unmarking all valid sources as selected.
         *
         * @param {Boolean} selectAll Determines if all valid sources should be selected or not
         */
        function toggleSelectAll(selectAll) {
            angular.forEach(vm.validSources, function(validSource) {
                validSource.$selected = selectAll;
                vm.onValidSourceSelect(validSource);
            });
        }

        /**
         * @ngdoc method
         * @methodOf admin-valid-source-list.controller:ValidSourceListController
         * @name setSelectAll
         *
         * @description
         * Responsible for making the checkbox "select all" checked when all valid sources are
         *     selected by user.
         */
        function setSelectAll() {
            var value = true;
            angular.forEach(vm.validSources, function(validSource) {
                value = value && validSource.$selected;
            });
            vm.selectAll = value;
        }

        /**
         * @ngdoc method
         * @methodOf admin-valid-source-list.controller:ValidSourceListController
         * @name loadPreviouslySelectedValidSources
         *
         * @description
         * Selects checkboxes on current page if checked before
         */
        function loadPreviouslySelectedValidSources() {
            var storageValidSources = $window.sessionStorage.getItem(vm.selectedValidSourcesStorageKey);
            storageValidSources = storageValidSources ? JSON.parse(storageValidSources) : {};

            for (var i = 0; i < vm.validSources.length; i++) {
                var vs = vm.validSources[i];

                if (storageValidSources[vs.id] !== undefined) {
                    vm.validSources[i].$selected = true;
                }
            }

            setSelectAll();
        }

        /**
         * @ngdoc method
         * @methodOf admin-valid-source-list.controller:ValidSourceListController
         * @name onValidSourceSelect
         *
         * @description
         * Syncs valid source selection with storage
         */
        function onValidSourceSelect(validSource) {
            var storageValidSources = $window.sessionStorage.getItem(vm.selectedValidSourcesStorageKey);

            storageValidSources = storageValidSources ? JSON.parse(storageValidSources) : {};

            var validSourceId = validSource.id;

            if (validSource.$selected) {
                storageValidSources[validSourceId] = validSource;
            } else {
                delete storageValidSources[validSourceId];
            }

            $window.sessionStorage.setItem(
                vm.selectedValidSourcesStorageKey, JSON.stringify(storageValidSources)
            );

            setSelectAll();
        }

        /**
         * @ngdoc method
         * @methodOf admin-valid-source-list.controller:ValidSourceListController
         * @name $onInit
         *
         * @description
         * Method that is executed on initiating ValidSourceListController.
         */
        function onInit() {
            if ($stateParams.storageKey === undefined) {
                $stateParams.storageKey = uuidGenerator.generate();
                $state.go($state.current.name, $stateParams, {
                    reload: false,
                    notify: false
                });
            }

            vm.selectedValidSourcesStorageKey = 'admin-valid-source-list/selected-valid-sources/'
                + $stateParams.storageKey;

            loadPreviouslySelectedValidSources();
        }

        function deleteSelectedValidSources() {
            var validSources = getSelected();

            if (validSources.length > 0) {
                confirmService
                    .confirm('adminValidSourceList.delete.confirm', 'adminValidSourceList.delete')
                    .then(function() {
                        loadingModalService.open();
                        angular.forEach(validSources, function(validSource) {
                            return new ValidSourceResource().delete(validSource);
                        });
                    })
                    .then(function() {
                        vm.goToPreviousState();
                    })
                    .then(function() {
                        notificationService.success('adminValidSourceList.validSourceDeletedSuccessfully');
                    })
                    .catch(function(error) {
                        loadingModalService.close();
                        notificationService.error('adminValidSourceList.failure');
                        return $q.reject(error);
                    })
                    .finally(function() {
                        loadingModalService.close();
                        $window.sessionStorage.removeItem('admin-valid-source-list/selected-valid-sources/'
                        + $stateParams.storageKey);
                        $state.go($state.current.name, $stateParams, {
                            reload: true
                        });
                    });
            } else {
                notificationService.error('adminValidSourceList.selectAtLeastOneValidSource');
            }
        }
    }
})();