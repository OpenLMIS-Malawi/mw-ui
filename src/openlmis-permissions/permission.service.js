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
     * @name openlmis-permissions.permissionService
     *
     * @description
     * Gets and stores a user's permissions from OpenLMIS. The permissions are
     * permission strings, which can be reformatted into different types of user
     * data.
     *
     * If there are permission strings stored locally, the OpenLMIS Auth
     * Service will not be queried for permission strings.
     *
     * A permission object is formatted like this
     *
     * ```
     *{
     *  right: 'EXAMPLE_RIGHT',
     *  facilityId: 'ABC-1234',
     *  programId: '9876-XYZ'
     *}
     * ```
     *
     * Permission strings are expected to be formatted like this
     * ```
     * EXAMPLE_RIGHT|ABC-1234|9876-XYZ
     * ```
     */
    angular
        .module('openlmis-permissions')
        .service('permissionService', service);

    service.$inject = [
        '$q', '$http', 'openlmisUrlFactory', 'localStorageService', 'Permission', 'currentUserRolesService',
        'currentUserService', '$injector'
    ];

    function service($q, $http, openlmisUrlFactory, localStorageService, Permission, currentUserRolesService,
                     currentUserService, $injector) {
        // Used in service.load and service.getPermissionStringsFromServer/service.empty respectively
        var savedUserId,
            dataPromise;

        this.hasPermission = hasPermission;
        this.hasPermissionWithAnyProgram = hasPermissionWithAnyProgram;
        this.hasPermissionWithAnyProgramAndAnyFacility = hasPermissionWithAnyProgramAndAnyFacility;
        this.load = load;
        this.empty = empty;
        this.testPermission = testPermission;
        this.hasRoleWithRight = hasRoleWithRight;
        this.hasRoleWithRightForProgramAndSupervisoryNode = hasRoleWithRightForProgramAndSupervisoryNode;
        this.hasRoleWithRightAndFacility = hasRoleWithRightAndFacility;
        this.requisitionGroupService = $injector.get('requisitionGroupService');

        /**
         * @ngdoc method
         * @methodOf openlmis-permissions.permissionService
         * @name hasPermission
         *
         * @param  {String} userId User to get test permission for
         * @param  {Object} permission Object representing a permission
         * @return {Promise} A promise that resolves a if there is a match
         *
         * @description
         * The returned promise will resolve if the browser has a matching
         * permission. If there is no permission that EXACTLY matches, then
         * the promise is rejected.
         *
         * If the permission object that is tested against doesn't have a
         * 'right' property, then it is immediately rejected.
         */
        function hasPermission(userId, permission) {
            return this.testPermission(userId, permission, permissionMatch);
        }

        /**
         * @ngdoc method
         * @methodOf openlmis-permissions.permissionService
         * @name hasPermissionWithAnyProgram
         *
         * @param  {String} userId User to get test permission for
         * @param  {Object} permission Object representing a permission
         * @return {Promise} A promise that resolves a if there is a match
         *
         * @description
         * The returned promise will resolve if the browser has a matching
         * permission for any program. If there is no permission that matches, then
         * the promise is rejected.
         *
         * If the permission object that is tested against doesn't have a
         * 'right' property, then it is immediately rejected.
         */
        function hasPermissionWithAnyProgram(userId, permission) {
            return this.testPermission(userId, permission, permissionMatchWithAnyProgram);
        }

        /**
         * @ngdoc method
         * @methodOf openlmis-permissions.permissionService
         * @name hasPermissionWithAnyProgramAndAnyFacility
         *
         * @param  {String} userId User to get test permission for
         * @param  {Object} permission Object representing a permission
         * @return {Promise} A promise that resolves a if there is a match
         *
         * @description
         * The returned promise will resolve if the browser has a matching
         * permission for any program and facility. If there is no permission that matches,
         * then the promise is rejected.
         *
         * If the permission object that is tested against doesn't have a
         * 'right' property, then it is immediately rejected.
         */
        function hasPermissionWithAnyProgramAndAnyFacility(userId, permission) {
            return this.testPermission(userId, permission, permissionMatchWithAnyProgramAndAnyFacility);
        }

        /**
         * @ngdoc method
         * @methodOf openlmis-permissions.permissionService
         * @name load
         *
         * @param {String} userId ID of user to get permissions for
         *
         * @return {Promise} A promise with an Array of permission objects
         *
         * @description
         * This method returns a list of permission. If there is a list of
         * permissions cached in the browser, those permissions are returned.
         * Otherwise, the OpenLMIS Auth service will be queried for the
         * permission strings of the currently logged in user.
         *
         * The promise will be rejected if:
         * - The user isn't authenticated
         */
        function load(userId) {

            if (!userId) {
                savedUserId = undefined;
                this.empty();
                return $q.reject();
            }

            if (userId !== savedUserId) {
                if (savedUserId) {
                    this.empty();
                }
                savedUserId = userId;
            }

            return getCachedPermissions()
                .catch(function() {
                    return getPermissionStringsFromServer(userId)
                        .then(parsePermissionStrings)
                        .then(savePermissions);
                });
        }

        /**
         * @ngdoc method
         * @methodOf openlmis-permissions.permissionService
         * @name empty
         *
         * @return {Promise} Promise resolves once cache is cleared
         *
         * @description
         * Clears the browser cache of any stored permissions.
         */
        function empty() {
            localStorageService.remove('permissions');
            dataPromise = null;
            return $q.resolve();
        }

        /**
         * @ngdoc method
         * @methodOf openlmis-permissions.permissionService
         * @name testPermission
         *
         * @param  {String}     userId              User to get test permission for
         * @param  {Object}     permission          Object representing a permission
         * @param  {Function}   permissionMatchFn   A function that match permission
         * @return {Promise}                        A promise that resolves a if there is a match
         *
         * @description
         * The returned promise will resolve if the browser has a matching
         * permission.
         *
         * If the permission object that is tested against doesn't have a
         * 'right' property, then it is immediately rejected.
         */
        function testPermission(userId, permission, permissionMatchFn) {
            if (!permission) {
                return $q.reject();
            }

            if (!permission.hasOwnProperty('right')) {
                return $q.reject();
            }

            var deferred = $q.defer();

            this.load(userId)
                .then(function(permissionsList) {
                    if (testPermissions(permissionsList, permission, permissionMatchFn)) {
                        deferred.resolve();
                    } else {
                        deferred.reject();
                    }
                })
                .catch(function() {
                    deferred.reject();
                });

            return deferred.promise;
        }

        /**
         * @ngdoc method
         * @methodOf openlmis-permissions.permissionService
         * @name hasRoleWithRight
         *
         * @description
         * Checks whether current user has a role with the given right name assigned.
         *
         * @param  {string}     rightName   the name of the right
         * @return {Promise}                the promise resolving to a boolean, true if user has role with the given
         *                                  right, false otherwise, the promise is rejected if checking right fails
         */
        function hasRoleWithRight(rightName) {
            return currentUserRolesService.getUserRoles()
                .then(function(roles) {
                    return roles
                        .filter(hasRight(rightName))
                        .length > 0;
                });
        }

        // MALAWISUP-4404: Fix error related to second requisition approval
        /**
         * @ngdoc method
         * @methodOf openlmis-permissions.permissionService
         * @name hasRoleWithRightForProgramAndSupervisoryNode
         *
         * @description
         * Checks whether current user has a role with the given right name assigned for the given program and
         * supervisory node.
         *
         * @param  {string}  rightName          the name of the right
         * @param  {Object}  requisition        the requisition 
         * @return {Promise}                    the promise resolving to a boolean, true if user has role with the given
         *                                      right for the given program and facility supervisory node, 
         *                                      false otherwise, the promise is rejected if checking right fails
         */
        function hasRoleWithRightForProgramAndSupervisoryNode(rightName, requisition) {
            var requisitionInFirstApproval = requisition.status === 'AUTHORIZED';
            var promiseArray = [
                currentUserRolesService.getUserRoles(),
                currentUserService.getUserInfo()
            ];

            if (requisitionInFirstApproval) {
                promiseArray.push(this.requisitionGroupService.getAll())
            }

            return $q
                .all(promiseArray)
                .then(function(resolves) {
                    var roles = resolves[0];
                    var user = resolves[1];
                    var requisitionGroups = requisitionInFirstApproval ? resolves[2] : [];

                    if (requisitionInFirstApproval) {
                        var facilitySupervisoryNodesIds = requisitionGroups.filter(function(requistionGroup) {
                        return requistionGroup.memberFacilities.filter(function(memberFacility) {
                            return memberFacility.id === requisition.facility.id;
                        }).length > 0;
                        }).map(function(matchedRequisitionGroup) {
                            return matchedRequisitionGroup.supervisoryNode.id;
                        });
                    }

                    var filterFunction = requisitionInFirstApproval ? 
                    function(role) {
                        return facilitySupervisoryNodesIds.includes(role.supervisoryNodeId);
                    } : matchesByProperty('supervisoryNodeId', requisition.supervisoryNode);

                    var matchingRoleIds = user.roleAssignments
                        .filter(matchesByProperty('programId', requisition.program.id))
                        .filter(filterFunction)
                        .map(toRoleId);

                    return roles
                        .filter(hasMatchingIds(matchingRoleIds))
                        .filter(hasRight(rightName))
                        .length > 0;
            });
        }
        // MALAWISUP-4404: Ends here

        /**
         * @ngdoc method
         * @methodOf openlmis-permissions.permissionService
         * @name hasRoleWithRightAndFacility
         *
         * @description
         * Checks whether current user has a role with the given right name assigned and also has a facility
         * being his home facility or supervisory node.
         *
         * @param  {string}     rightName   the name of the right
         * @return {Promise}                the promise resolving to a boolean, true if user has role with the given
         *                                  right and a facility, false otherwise, the promise is rejected
         *                                  if checking right fails
         */
        function hasRoleWithRightAndFacility(rightName) {
            return $q.all([
                currentUserService.getUserInfo(),
                currentUserRolesService.getUserRoles(),
                hasRoleWithRight(rightName)
            ]).then(function(resolves) {
                var user = resolves[0],
                    roles = resolves[1],
                    roleWithRight = resolves[2];

                var matchingRoleIds = user.roleAssignments
                    .filter(isNotNull('supervisoryNodeId'))
                    .map(toRoleId);

                var roleWithRightAndSupervisoryNode = roles
                    .filter(hasMatchingIds(matchingRoleIds))
                    .filter(hasRight(rightName))
                    .length > 0;

                return (roleWithRight && user.homeFacilityId) || roleWithRightAndSupervisoryNode;
            });
        }

        function hasMatchingIds(matchingRoleIds) {
            return function(role) {
                return matchingRoleIds.indexOf(role.id) > -1;
            };
        }

        function hasRight(rightName) {
            return function(role) {
                return role.rights.filter(function(right) {
                    return right.name === rightName;
                }).length > 0;
            };
        }

        function matchesByProperty(propertyName, value) {
            return function(roleAssignment) {
                return roleAssignment[propertyName] === value;
            };
        }

        function testPermissions(permissionsList, permission, permissionMatchFn) {
            var i = 0;
            for (i; i < permissionsList.length; i++) {
                if (permissionMatchFn(permissionsList[i], permission.right, permission.facilityId,
                    permission.programId)) {
                    return true;
                }
            }

            return false;
        }

        function permissionMatch(permission, right, facilityId, programId) {
            return permission.right === right
                && permission.facilityId === facilityId
                && permission.programId === programId;
        }

        function permissionMatchWithAnyProgram(permission, right, facilityId) {
            return permission.right === right && permission.facilityId === facilityId;
        }

        function permissionMatchWithAnyProgramAndAnyFacility(permission, right) {
            return permission.right === right;
        }

        function parsePermissionStrings(permissionStrings) {
            var permissions = [];

            permissionStrings.forEach(function(string) {
                var parts = string.split('|');
                permissions.push(new Permission(parts[0], parts[1], parts[2]));
            });

            return $q.resolve(permissions);
        }

        function getPermissionStringsFromServer(userId) {
            if (!userId) {
                return $q.reject();
            }

            if (dataPromise === null || dataPromise === undefined) {
                dataPromise = $http.get(openlmisUrlFactory('/api/users/' + userId + '/permissionStrings'))
                    .then(function(response) {
                        return response.data;
                    })
                    .catch(function() {
                        return $q.reject();
                    });
            }
            return dataPromise;
        }

        function getCachedPermissions() {
            var permissions = angular.fromJson(localStorageService.get('permissions'));
            if (permissions && Array.isArray(permissions)) {
                return $q.resolve(permissions);
            }
            return $q.reject();

        }

        function savePermissions(permissions) {
            localStorageService.add('permissions', angular.toJson(permissions));
            return $q.resolve(permissions);
        }

        function toRoleId(roleAssignment) {
            return roleAssignment.roleId;
        }

        function isNotNull(propertyName) {
            return function(roleAssignment) {
                return !!roleAssignment[propertyName];
            };
        }
    }

})();