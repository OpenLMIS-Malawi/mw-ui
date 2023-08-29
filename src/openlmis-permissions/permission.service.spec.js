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

describe('openlmis-permissions.this.permissionService', function() {

    beforeEach(function() {
        module('openlmis-permissions');

        inject(function($injector) {
            this.UserDataBuilder = $injector.get('UserDataBuilder');
            this.RoleDataBuilder = $injector.get('RoleDataBuilder');
            this.RightDataBuilder = $injector.get('RightDataBuilder');
            this.$rootScope = $injector.get('$rootScope');
            this.permissionService = $injector.get('permissionService');
            this.localStorageService = $injector.get('localStorageService');
            this.openlmisUrlFactory = $injector.get('openlmisUrlFactory');
            this.$httpBackend = $injector.get('$httpBackend');
            this.currentUserService = $injector.get('currentUserService');
            this.RoleResource = $injector.get('RoleResource');
            this.$q = $injector.get('$q');
            this.currentUserRolesService = $injector.get('currentUserRolesService');
            this.alertService = $injector.get('alertService');
            this.offlineService = $injector.get('offlineService');
            this.requisitionGroupService = $injector.get('requisitionGroupService');
        });

        this.possessedRightName = 'POSSESSED_RIGHT';
        this.otherPossessedRightName = 'OTHER_POSSESSED_RIGHT';
        this.anotherPossessedRightName = 'ANOTHER_POSSESSED_RIGHT';
        this.newPossessedRightName = 'NEW_POSSESSED_RIGHT';
        this.nonPossessedRightName = 'NON_POSSESSED_RIGHT';
        this.supervisoryNodeId = 'supervisory-node-id';
        this.programId = 'program-id';
        this.permissionString1 = 'permissionString1',
        this.permissionString2 = 'permissionString2',
        this.facilityId = 'facility-id',
        this.someFacility = 'some-facility';

        // MALAWISUP-4404: Fix error related to second requisition approval
        this.requisition = {
            facility: {
                id: this.facilityId
            },
            program: {
                id: this.programId
            },
            supervisoryNode: this.supervisoryNodeId,
            status: 'APPROVED'
        }
        // MALAWISUP-4404: Ends here

        this.possessedRight = new this.RightDataBuilder()
            .withName(this.possessedRightName)
            .build();

        this.otherPossessedRight = new this.RightDataBuilder()
            .withName(this.otherPossessedRightName)
            .build();

        this.anotherPossessedRight = new this.RightDataBuilder()
            .withName(this.anotherPossessedRightName)
            .build();

        this.newPossessedRight = new this.RightDataBuilder()
            .withName(this.newPossessedRightName)
            .build();

        this.nonPossessedRight = new this.RightDataBuilder()
            .withName(this.nonPossessedRightName)
            .build();

        this.roles = [
            new this.RoleDataBuilder()
                .withSupervisionType()
                .withRight(this.possessedRight)
                .build(),
            new this.RoleDataBuilder()
                .withSupervisionType()
                .withRight(this.otherPossessedRight)
                .build(),
            new this.RoleDataBuilder()
                .withSupervisionType()
                .withRight(this.anotherPossessedRight)
                .build(),
            new this.RoleDataBuilder()
                .withSupervisionType()
                .withRight(this.newPossessedRight)
                .build(),
            new this.RoleDataBuilder()
                .withSupervisionType()
                .withRight(this.nonPossessedRight)
                .build()
        ];

        this.user = new this.UserDataBuilder()
            .withSupervisionRoleAssignment(this.roles[0].id, this.supervisoryNodeId, this.programId)
            .withSupervisionRoleAssignment(this.roles[1].id, this.supervisoryNodeId, 'program-id-2')
            .withSupervisionRoleAssignment(this.roles[2].id, 'supervisory-node-id-2', this.programId)
            .withSupervisionRoleAssignment(this.roles[3].id, null, this.programId)
            .buildReferenceDataUserJson();

        this.permissionStrings = [
            this.permissionString1 + '|' + this.facilityId + '|' + this.programId,
            this.permissionString2 + '|' + this.someFacility
        ];

        this.$httpBackend
            .when('GET', this.openlmisUrlFactory('/api/users/userId/permissionStrings'))
            .respond(this.permissionStrings);

        spyOn(this.localStorageService, 'get').andReturn(null);
        spyOn(this.localStorageService, 'add').andCallThrough();
        spyOn(this.localStorageService, 'remove');
        spyOn(this.RoleResource.prototype, 'query').andReturn(this.$q.resolve(this.roles));
        spyOn(this.currentUserService, 'getUserInfo').andReturn(this.$q.resolve(this.user));
        spyOn(this.currentUserRolesService, 'getUserRoles').andReturn(this.$q.resolve([
            this.roles[0],
            this.roles[1],
            this.roles[2],
            this.roles[3]
        ]));
        spyOn(this.offlineService, 'isOffline').andReturn(false);
        spyOn(this.requisitionGroupService, 'getAll').andReturn(this.$q.resolve([
            {
                memberFacilities: [
                    {
                        id: this.facilityId
                    }
                ],
                supervisoryNode: {
                    id: this.supervisoryNodeId
                }
            }
        ]));

    });

    it('empty will clear permission strings from browser', function() {
        this.permissionService.empty();

        expect(this.localStorageService.remove).toHaveBeenCalledWith('permissions');
    });

    it('will fail and empty all permissions if userId not entered', function() {
        spyOn(this.permissionService, 'empty').andCallThrough();

        var failed = false;
        this.permissionService.load()
            .catch(function() {
                failed = true;
            });

        this.$rootScope.$apply();

        expect(failed).toBe(true);
        expect(this.permissionService.empty).toHaveBeenCalled();
    });

    it('gets permission strings from the server, and saves them locally', function() {
        var permissions;
        this.permissionService.load('userId')
            .then(function(response) {
                permissions = response;
            });

        this.$httpBackend.flush();
        this.$rootScope.$apply();

        expect(permissions).toBeTruthy();
        expect(Array.isArray(permissions)).toBeTruthy();

        expect(this.localStorageService.add).toHaveBeenCalledWith('permissions', angular.toJson(permissions));
    });

    it('correctly parses permission strings from the server', function() {
        var permissions;
        this.permissionService.load('userId')
            .then(function(response) {
                permissions = response;
            });

        this.$httpBackend.flush();
        this.$rootScope.$apply();

        expect(permissions.length).toBe(2);

        expect(permissions[0].right).toBe('permissionString1');
        expect(permissions[0].facilityId).toBe('facility-id');
        expect(permissions[0].programId).toBe(this.programId);

        expect(permissions[1].right).toBe('permissionString2');
        expect(permissions[1].facilityId).toBe('some-facility');
        expect(permissions[1].programId).toBeUndefined();
    });

    it('will return cached permissions, if they are available and savedUserId is undefined', function() {
        this.localStorageService.get.andReturn([{
            right: 'example'
        }]);

        var permissions;
        this.savedUserId = undefined;
        this.permissionService.load('userId')
            .then(function(response) {
                permissions = response;
            });

        this.$rootScope.$apply();

        expect(permissions.length).toBe(1);
        expect(permissions[0].right).toBe('example');
        expect(this.localStorageService.remove).not.toHaveBeenCalledWith('permissions');

        this.$httpBackend.verifyNoOutstandingRequest();
    });

    it('will return cached permissions, if they are available and userId equal to savedUserId', function() {
        this.localStorageService.get.andReturn([{
            right: 'example'
        }]);

        var permissions;
        this.permissionService.load('userId')
            .then(function(response) {
                permissions = response;
            });

        this.permissionService.load('userId')
            .then(function(response) {
                permissions = response;
            });

        this.$rootScope.$apply();

        expect(permissions.length).toBe(1);
        expect(permissions[0].right).toBe('example');
        expect(this.localStorageService.remove).not.toHaveBeenCalledWith('permissions');

        this.$httpBackend.verifyNoOutstandingRequest();
    });

    it('should remove permissions from localStorage if userId not equal to savedUserId', function() {
        this.permissionService.load('userId_1');
        this.permissionService.load('userId_2');
        this.$rootScope.$apply();

        expect(this.localStorageService.remove).toHaveBeenCalledWith('permissions');
    });

    it('will call backend if no available cached permissions', function() {
        this.localStorageService.get.andReturn(null);

        var permissions;
        this.permissionService.load('userId')
            .then(function(response) {
                permissions = response;
            });
        this.$httpBackend.flush();
        this.$rootScope.$apply();

        expect(permissions.length).toBe(2);

        expect(permissions[0].right).toBe(this.permissionString1);
        expect(permissions[0].facilityId).toBe(this.facilityId);
        expect(permissions[0].programId).toBe(this.programId);

        expect(permissions[1].right).toBe(this.permissionString2);
        expect(permissions[1].facilityId).toBe(this.someFacility);
        expect(permissions[1].programId).toBeUndefined();

        expect(this.localStorageService.add).toHaveBeenCalledWith('permissions', angular.toJson(permissions));

        this.$httpBackend.verifyNoOutstandingRequest();

        this.permissionService.load('userId');
        this.$rootScope.$apply();
        this.$httpBackend.verifyNoOutstandingRequest();
    });

    it('will reject if no available cached permissions in offline mode', function() {
        spyOn(this.alertService, 'error');

        this.offlineService.isOffline.andReturn(true);
        this.localStorageService.get.andReturn(null);

        this.permissionService.load('userId');
        this.$rootScope.$apply();

        expect(this.offlineService.isOffline).toHaveBeenCalled();
        expect(this.alertService.error).toHaveBeenCalledWith('openlmisOffline.actionNotAllowedOffline');
        this.$httpBackend.verifyNoOutstandingRequest();
    });

    describe('hasPermission', function() {

        beforeEach(function() {
            this.localStorageService.get.andReturn([{
                right: 'example',
                facilityId: 'facility-id'
            }]);

            this.checkPermission = checkPermission;
        });

        function checkPermission(permissionObj) {
            var success = false;

            this.permissionService.hasPermission('userId', permissionObj)
                .then(function() {
                    success = true;
                });

            this.$rootScope.$apply();
            return success;
        }

        it('will return FALSE if no arguments', function() {
            expect(this.checkPermission({})).toBe(false);
        });

        it('will return FALSE if the right is not set', function() {
            expect(this.checkPermission({
                facilityId: 'facility-id'
            })).toBe(false);

            expect(this.checkPermission({
                right: 'example',
                facilityId: 'facility-id'
            })).toBe(true);
        });

        it('will resolve promise if the argument EXACTLY matches a permission', function() {
            // Too vague
            expect(this.checkPermission({
                right: 'example'
            })).toBe(false);

            // Too strict
            expect(this.checkPermission({
                right: 'example',
                programId: this.programId,
                facilityId: 'facility-id'
            })).toBe(false);

            // Just right
            expect(this.checkPermission({
                right: 'example',
                facilityId: 'facility-id'
            })).toBe(true);
        });

        it('will reject promise if the argument is missing program', function() {
            this.localStorageService.get.andReturn([{
                right: 'right',
                facilityId: 'facility-id',
                programId: this.programId
            }]);

            expect(this.checkPermission({
                right: 'right',
                facilityId: 'facility-id'
            })).toBe(false);
        });

    });

    describe('hasPermissionWithAnyProgram', function() {

        beforeEach(function() {
            this.localStorageService.get.andReturn([{
                right: 'example',
                facilityId: 'facility-id'
            }]);

            this.checkPermission = checkPermission;
        });

        function checkPermission(permissionObj) {
            var success = false;

            this.permissionService.hasPermissionWithAnyProgram('userId', permissionObj)
                .then(function() {
                    success = true;
                });

            this.$rootScope.$apply();
            return success;
        }

        it('will return FALSE if no arguments', function() {
            expect(this.checkPermission({})).toBe(false);
        });

        it('will return FALSE if the right is not set', function() {
            expect(this.checkPermission({
                facilityId: 'facility-id'
            })).toBe(false);

            expect(this.checkPermission({
                right: 'example',
                facilityId: 'facility-id'
            })).toBe(true);
        });

        it('will resolve promise if the argument EXACTLY matches a permission', function() {
            // Too vague
            expect(this.checkPermission({
                right: 'example'
            })).toBe(false);

            // Not too strict, program is ignored
            expect(this.checkPermission({
                right: 'example',
                programId: this.programId,
                facilityId: 'facility-id'
            })).toBe(true);

            // Just right
            expect(this.checkPermission({
                right: 'example',
                facilityId: 'facility-id'
            })).toBe(true);
        });

        it('will resolve promise if the argument is missing program', function() {
            this.localStorageService.get.andReturn([{
                right: 'right',
                facilityId: 'facility-id',
                programId: this.programId
            }]);

            expect(this.checkPermission({
                right: 'right',
                facilityId: 'facility-id'
            })).toBe(true);
        });

    });

    describe('hasPermissionWithAnyProgramAndAnyFacility', function() {

        beforeEach(function() {
            this.localStorageService.get.andReturn([{
                right: 'right',
                facilityId: 'facility-id',
                programId: this.programId
            }]);

            this.checkPermission = checkPermission;
        });

        function checkPermission(permissionObj) {
            var success = false;
            this.permissionService.hasPermissionWithAnyProgramAndAnyFacility('userId', permissionObj)
                .then(function() {
                    success = true;
                });
            this.$rootScope.$apply();
            return success;
        }

        it('will return FALSE if no arguments', function() {
            expect(this.checkPermission({})).toBe(false);
        });

        it('will return FALSE if the right is not set', function() {
            expect(this.checkPermission({
                facilityId: 'facility-id',
                programId: this.programId
            })).toBe(false);
        });

        it('will resolve promise if the argument matches a permission ignoring facility and program', function() {
            expect(this.checkPermission({
                right: 'right',
                programId: this.programId,
                facilityId: 'facility-id'
            })).toBe(true);
        });

        it('will resolve promise if the argument matches a permission right', function() {
            expect(this.checkPermission({
                right: 'right'
            })).toBe(true);
        });
    });

    describe('hasRoleWithRight', function() {

        it('should return true if user has a role with the given right', function() {
            var result;
            this.permissionService
                .hasRoleWithRight(this.possessedRightName)
                .then(function(response) {
                    result = response;
                });
            this.$rootScope.$apply();

            expect(result).toEqual(true);
        });

        it('should return false if user has no role with the given right', function() {
            var result;
            this.permissionService
                .hasRoleWithRight(this.nonPossessedRightName)
                .then(function(response) {
                    result = response;
                });
            this.$rootScope.$apply();

            expect(result).toEqual(false);
        });

    });

    describe('hasRoleWithRightForProgramAndSupervisoryNode', function() {

        it('should return false if user has not role with the given right', function() {
            var result;
            this.permissionService
                .hasRoleWithRightForProgramAndSupervisoryNode(
                    this.nonPossessedRightName,
                    // MALAWISUP-4404: Fix error related to second requisition approval
                    this.requisition
                    // MALAWISUP-4404: Ends here
                    
                )
                .then(function(response) {
                    result = response;
                });
            this.$rootScope.$apply();

            expect(result).toEqual(false);
        });

        it('should return false if user has role with the given right for program but different node', function() {
            var result;
            this.permissionService
                .hasRoleWithRightForProgramAndSupervisoryNode(
                    this.otherPossessedRight,
                    // MALAWISUP-4404: Fix error related to second requisition approval
                    this.requisition
                    // MALAWISUP-4404: Ends here
                )
                .then(function(response) {
                    result = response;
                });
            this.$rootScope.$apply();

            expect(result).toEqual(false);
        });

        it('should return false if user has role with the given right for node but different program', function() {
            var result;
            this.permissionService
                .hasRoleWithRightForProgramAndSupervisoryNode(
                    this.anotherPossessedRight,
                    // MALAWISUP-4404: Fix error related to second requisition approval
                    this.requisition
                    // MALAWISUP-4404: Ends here
                )
                .then(function(response) {
                    result = response;
                });
            this.$rootScope.$apply();

            expect(result).toEqual(false);
        });

        it('should return true if user has role with the given right, program and node', function() {
            var result;
            this.permissionService
                .hasRoleWithRightForProgramAndSupervisoryNode(
                    this.possessedRightName,
                    // MALAWISUP-4404: Fix error related to second requisition approval
                    this.requisition
                    // MALAWISUP-4404: Ends here
                )
                .then(function(response) {
                    result = response;
                });
            this.$rootScope.$apply();

            expect(result).toEqual(true);
        });

    });

    describe('hasRoleWithRightAndFacility', function() {

        it('should return false if user has no role with the given right', function() {
            var result;
            this.user.homeFacilityId = true;
            this.permissionService
                .hasRoleWithRightAndFacility(this.nonPossessedRightName)
                .then(function(response) {
                    result = response;
                });
            this.$rootScope.$apply();

            expect(result).toEqual(false);
        });

        it('should return false if user has role with the given right but has no facility', function() {
            var result;
            this.user.homeFacilityId = false;
            this.permissionService
                .hasRoleWithRightAndFacility(this.newPossessedRightName)
                .then(function(response) {
                    result = response;
                });
            this.$rootScope.$apply();

            expect(result).toEqual(false);
        });

        it('should return true if user has role with the given right and supervisory node', function() {
            var result;
            this.user.homeFacilityId = false;
            this.permissionService
                .hasRoleWithRightAndFacility(this.possessedRightName)
                .then(function(response) {
                    result = response;
                });
            this.$rootScope.$apply();

            expect(result).toEqual(true);
        });

        it('should return true if user has role with the given right and home facility', function() {
            var result;
            this.user.homeFacilityId = true;
            this.permissionService
                .hasRoleWithRightAndFacility(this.newPossessedRightName)
                .then(function(response) {
                    result = response;
                });
            this.$rootScope.$apply();

            expect(result).toEqual(true);
        });
    });
});
