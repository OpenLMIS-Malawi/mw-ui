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
     * @name admin-user-roles.controller:UserRolesTabController
     *
     * @description
     * Exposes method for adding/removing user roles.
     */
    angular
        .module('admin-user-roles')
        .controller('UserRolesTabController', controller);

    // MALAWISUP-3888 Add checkboxes and column filters under roles when removing users roles

    controller.$inject = [
        'user', 'supervisoryNodes', 'programs', 'warehouses', '$stateParams', '$q', 'tab', '$state', '$filter',
        'notificationService', 'confirmService', 'roleAssignments', 'filteredRoles', 'roleRightsMap', 'messageService',
        'UuidGenerator', '$window'
    ];

    function controller(user, supervisoryNodes, programs, warehouses, $stateParams, $q, tab, $state, $filter,
                        notificationService, confirmService, roleAssignments, filteredRoles, roleRightsMap, messageService,
                        UuidGenerator, $window) {

        var vm = this;
        vm.$window = $window;
        vm.uuidGenerator = new UuidGenerator();
        vm.$onInit = onInit;
        vm.removeRoles = removeRoles;
        vm.addRole = addRole;
        vm.removeRole = removeRole;
        vm.search = search;
        vm.toggleSelectAll = toggleSelectAll;
        vm.setSelectAll = setSelectAll;
        vm.onRoleSelect = onRoleSelect;
        vm.getSelected = getSelected;

        /**
         * @ngdoc property
         * @propertyOf admin-user-roles.controller:UserRolesTabController
         * @name selectAll
         * @type {Boolean}
         *
         * @description
         * Indicates if all roles from list are selected or not.
         */
        vm.selectAll = false;
        // MALAWISUP-3888: Ends here

        /**
         * @ngdoc property
         * @propertyOf admin-user-roles.controller:UserRolesTabController
         * @name roles
         * @type {Array}
         *
         * @description
         * List of roles for given type.
         */
        vm.filteredRoles = undefined;

        /**
         * @ngdoc property
         * @propertyOf admin-user-roles.controller:UserRolesTabController
         * @name supervisoryNodes
         * @type {Array}
         *
         * @description
         * List of all supervisory nodes.
         */
        vm.supervisoryNodes = undefined;

        /**
         * @ngdoc property
         * @propertyOf admin-user-roles.controller:UserRolesTabController
         * @name warehouses
         * @type {Array}
         *
         * @description
         * List of all warehouses.
         */
        vm.warehouses = undefined;

        /**
         * @ngdoc property
         * @propertyOf admin-user-roles.controller:UserRolesTabController
         * @name programs
         * @type {Array}
         *
         * @description
         * List of all programs.
         */
        vm.programs = undefined;

        /**
         * @ngdoc property
         * @propertyOf admin-user-roles.controller:UserRolesTabController
         * @name selectedType
         * @type {String}
         *
         * @description
         * Currently selected role type.
         */
        vm.selectedType = undefined;

        /**
         * @ngdoc property
         * @propertyOf admin-user-roles.controller:UserRolesTabController
         * @name selectedRole
         * @type {Object}
         *
         * @description
         * Contains selected role.
         */
        vm.selectedRole = undefined;

        /**
         * @ngdoc property
         * @propertyOf admin-user-roles.controller:UserRolesTabController
         * @name selectedSupervisoryNode
         * @type {Object}
         *
         * @description
         * Contains selected supervisory node.
         */
        vm.selectedSupervisoryNode = undefined;

        /**
         * @ngdoc property
         * @propertyOf admin-user-roles.controller:UserRolesTabController
         * @name selectedProgram
         * @type {Object}
         *
         * @description
         * Contains selected program.
         */
        vm.selectedProgram = undefined;

        /**
         * @ngdoc property
         * @propertyOf admin-user-roles.controller:UserRolesTabController
         * @name selectedWarehouse
         * @type {Object}
         *
         * @description
         * Contains selected warehouse.
         */
        vm.selectedWarehouse = undefined;

        /**
         * @ngdoc property
         * @propertyOf admin-user-roles.controller:UserRolesTabController
         * @name editable
         * @type {boolean}
         *
         * @description
         * Flag defining whether the roles can be edited.
         */
        vm.editable = undefined;

        // MALAWISUP-3888 Add checkboxes and column filters under roles when removing users roles
         /**
         * @ngdoc property
         * @propertyOf admin-valid-destination-list.controller:ValidDestinationListController
         * @name roleId
         * @type {String}
         *
         * @description
         * Contains role id param for searching roles by role id.
         */
        vm.roleId = undefined;

        /**
         * @ngdoc property
         * @propertyOf admin-valid-destination-list.controller:ValidDestinationListController
         * @name programId
         * @type {String}
         *
         * @description
         * Contains program id param for searching roles by program id.
         */
        vm.programId = undefined;

        /**
         * @ngdoc method
         * @methodOf admin-user-roles.controller:UserRolesTabController
         * @name $onInit
         *
         * @description
         * Initialization method of the UserFormModalController.
         */

        function onInit() {
            vm.supervisoryNodes = supervisoryNodes;
            vm.warehouses = warehouses;
            vm.programs = programs;
            vm.selectedType = tab;
            vm.roleAssignments = roleAssignments;
            vm.filteredRoles = filteredRoles;
            vm.editable = true;
            vm.programId = $stateParams.programId;
            vm.roleId = $stateParams.roleId;
            vm.getParams = getParams;

            vm.showErrorColumn = roleAssignments.filter(function(role) {
                return role.errors && role.errors.length;
            }).length > 0;
            vm.roleRightsMap = roleRightsMap;

            if ($stateParams.storageKey === undefined) {
                $stateParams.storageKey = vm.uuidGenerator.generate();
                $state.go($state.current.name, $stateParams, {
                    reload: false,
                    notify: false
                });
            }

            vm.selectedRolesStorageKey = 'admin-user-roles/selected-roles/'
                + $stateParams.storageKey;

            if (tab == 'fulfillment' || tab == 'supervision') {
                loadPreviouslySelectedRoles();
            }
        }

        function getParams() {
            return $stateParams;
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-roles.controller:UserRolesTabController
         * @name getSelected
         *
         * @description
         * Returns a list of roles to delete selected by user
         *
         * @return {Array} list of selected user roles
         */
        function getSelected() {
                var storageSelected = $window.sessionStorage.getItem(vm.selectedRolesStorageKey);

                storageSelected = storageSelected ? JSON.parse(storageSelected) : {};

                var selectedRoles = [];

                for (var id in storageSelected) {
                     if (storageSelected.hasOwnProperty(id)) {
                        selectedRoles.push(storageSelected[id]);
                    }
                }

                angular.forEach(vm.roleAssignments, function(roleAssignment) {
                    if (roleAssignment.$selected && roleAssignments[roleAssignment.id] === undefined) {
                        selectedRoles.push(roleAssignment);
                    }
                });

                return selectedRoles;
                }

        /**
         * @ngdoc method
         * @methodOf admin-user-roles.controller:UserRolesTabController
         * @name search
         *
         * @description
         * Reloads the page with new search parameters.
         */
        function search() {
            var stateParams = angular.copy($stateParams);

            stateParams.programId = vm.programId;
            stateParams.roleId = vm.roleId;

            $state.go('openlmis.administration.users.roles.' + tab, stateParams, {
                reload: false
            });
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-roles.controller:UserRolesTabController
         * @name toggleSelectAll
         *
         * @description
         * Responsible for marking/unmarking all roles as selected.
         *
         * @param {Boolean} selectAll Determines if all roles should be selected or not
         */
        function toggleSelectAll(selectAll) {
            angular.forEach(vm.items, function(items) {
                items.$selected = selectAll;
                vm.onRoleSelect(items);
            });
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-roles.controller:UserRolesTabController
         * @name setSelectAll
         *
         * @description
         * Responsible for making the checkbox "select all" checked when all roles are
         *     selected by user.
         */
        function setSelectAll() {
            var value = true;
            angular.forEach(vm.items, function(item) {
                value = value && item.$selected;
            });
            vm.selectAll = value;
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-roles.controller:UserRolesTabController
         * @name loadPreviouslySelectedRoles
         *
         * @description
         * Selects checkboxes on current page if checked before
         */
        function loadPreviouslySelectedRoles() {
            var storageRoles = $window.sessionStorage.getItem(vm.selectedRolesStorageKey);
            storageRoles = storageRoles ? JSON.parse(storageRoles) : {};

            for (var i = 0; i < vm.roleAssignments.length; i++) {
                var vs = vm.roleAssignments[i];

                if (storageRoles[vs.id] !== undefined) {
                    vm.roleAssignments[i].$selected = true;
                }
            }
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-roles.controller:UserRolesTabController
         * @name onRoleSelect
         *
         * @description
         * Syncs roles selection with storage
         */
        function onRoleSelect(selectedRole) {
            var storageRoles = $window.sessionStorage.getItem(vm.selectedRolesStorageKey);

            storageRoles = storageRoles ? JSON.parse(storageRoles) : {};

            var selectedRoleId = selectedRole.programId + '/' + selectedRole.roleId + '/' + selectedRole.supervisoryNodeId;

            if (selectedRole.$selected) {
                storageRoles[selectedRoleId] = selectedRole;
            } else {
                delete storageRoles[selectedRoleId];
            }

            $window.sessionStorage.setItem(
                vm.selectedRolesStorageKey, JSON.stringify(storageRoles)
            );

            setSelectAll();
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-roles.controller:UserRolesTabController
         * @name removeRoles
         *
         * @description
         * Removes role from user object.
         *
         */
        function removeRoles() {
            var selectedRoles = getSelected();
                confirmService.confirmDestroy('adminUserRoles.removeRole.question', 'adminUserRoles.removeRoles.label')
                    .then(function() {
                        for (var key in selectedRoles) {
                            user.removeRoleAssignment(selectedRoles[key]);
                        }
                        $window.sessionStorage.removeItem(vm.selectedRolesStorageKey);
                        reloadState();
                        });
        }

        // MALAWISUP-3888: Ends here

        /**
         * @ngdoc method
         * @methodOf admin-user-roles.controller:UserRolesTabController
         * @name addRole
         *
         * @description
         * Adds new role assignment to user object.
         *
         * @return {Promise} resolves if new role is valid
         */
        function addRole() {
            try {
                user.addRoleAssignment(vm.selectedRole.id, vm.selectedRole.name, tab,
                    vm.selectedProgram ? vm.selectedProgram.id : undefined,
                    vm.selectedProgram ? vm.selectedProgram.name : undefined,
                    vm.selectedSupervisoryNode ? vm.selectedSupervisoryNode.id : undefined,
                    vm.selectedSupervisoryNode ? $filter('supervisoryNode')(vm.selectedSupervisoryNode) : undefined,
                    vm.selectedWarehouse ? vm.selectedWarehouse.id : undefined,
                    vm.selectedWarehouse ? vm.selectedWarehouse.name : undefined);
                reloadState();
                return $q.resolve();
            } catch (error) {
                notificationService.error(error.message);
                return $q.reject();
            }
        }

         /**
         * @ngdoc method
         * @methodOf admin-user-roles.controller:UserRolesTabController
         * @name removeRole
         *
         * @description
         * Removes role from user object.
         *
         * @param {Object} roleAssignment the role assignment to be removed
         */
        function removeRole(roleAssignment) {
            var roleToBeRemoved = vm.filteredRoles.filter(function(role) {
                return role.id === roleAssignment.roleId;
            });

            var roleUsedByNumber =
                roleToBeRemoved.length
                    ? roleToBeRemoved[0].count > 0
                        ? roleToBeRemoved[0].count - 1
                        : 0
                    : [];

            var confirmMessage = messageService.get('adminUserRoles.removeRole.question', {
                roleName: roleAssignment.roleName,
                remainingUsers: roleUsedByNumber
            });

            confirmService.confirmDestroy(confirmMessage, 'adminUserRoles.removeRole.label')
                .then(function() {
                    user.removeRoleAssignment(roleAssignment);
                    reloadState();
                });
        }

        function reloadState() {
            $state.go('openlmis.administration.users.roles.' + tab, $stateParams, {
                reload: 'openlmis.administration.users.roles.' + tab
            });
        }
    }
})();