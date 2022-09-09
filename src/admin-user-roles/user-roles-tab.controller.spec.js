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

describe('UserRolesTabController', function() {

    beforeEach(function() {

        module('admin-user-roles');
        inject(function($injector) {
            this.$controller = $injector.get('$controller');
            this.$rootScope = $injector.get('$rootScope');
            this.$state = $injector.get('$state');
            this.$q = $injector.get('$q');
            this.ROLE_TYPES = $injector.get('ROLE_TYPES');
            this.UserDataBuilder = $injector.get('UserDataBuilder');
            this.RoleDataBuilder = $injector.get('RoleDataBuilder');
            this.ProgramDataBuilder = $injector.get('ProgramDataBuilder');
            this.FacilityDataBuilder = $injector.get('FacilityDataBuilder');
            this.SupervisoryNodeDataBuilder = $injector.get('SupervisoryNodeDataBuilder');
            this.confirmService = $injector.get('confirmService');
            this.notificationService = $injector.get('notificationService');
            // MALAWISUP-3888 Add checkboxes and column filters under roles when removing users roles
            this.UuidGenerator =  $injector.get('UuidGenerator');
        });

        this.supervisoryNodes = [
            new this.SupervisoryNodeDataBuilder().build(),
            new this.SupervisoryNodeDataBuilder()
                .withName('Supervisory Node')
                .withFacility(
                    new this.FacilityDataBuilder()
                        .withName('Facility')
                        .build()
                )
                .build()
        ];
        this.warehouses = [
            new this.FacilityDataBuilder().build(),
            new this.FacilityDataBuilder().build()
        ];
        this.programs = [
            new this.ProgramDataBuilder().build(),
            new this.ProgramDataBuilder().build()
        ];

        this.roles = [
            new this.RoleDataBuilder().withSupervisionType()
                .build(),
            new this.RoleDataBuilder().withSupervisionType()
                .build()
        ];

        this.user = new this.UserDataBuilder()
            .withSupervisionRoleAssignment(this.roles[0].id, this.supervisoryNodes[0].id, this.programs[0].id)
            .withGeneralAdminRoleAssignment(this.roles[1].id)
            .build();

        this.uuidGenerator = new this.UuidGenerator();
        this.stateParams = {
            page: 0,
            size: 10,
            storageKey: this.uuidGenerator.generate()
        };

        this.roleRightsMap = {};
        this.roleRightsMap[this.roles[0].id] = this.roles[0].rights;
        this.roleRightsMap[this.roles[1].id] = this.roles[1].rights;

        spyOn(this.notificationService, 'error');
        spyOn(this.notificationService, 'success');
        spyOn(this.confirmService, 'confirmDestroy');

        this.vm = this.$controller('UserRolesTabController', {
            $stateParams: this.stateParams,
            user: this.user,
            filteredRoles: this.roles,
            supervisoryNodes: this.supervisoryNodes,
            warehouses: this.warehouses,
            programs: this.programs,
            roleAssignments: [this.user.roleAssignments[0], this.user.roleAssignments[1]],
            tab: this.ROLE_TYPES.SUPERVISION,
            roleRightsMap: this.roleRightsMap,
            UuidGenerator: this.UuidGenerator,
            confirmService: this.confirmService
        });

        this.vm.$onInit();
        this.$rootScope.$apply();

        spyOn(this.$state, 'go').andReturn();
    });

    describe('on init', function() {

        afterEach(function() {
            inject(function($injector) {
                var selected = this.vm.getSelected();
                for (var i = 0; i < selected.length; i++) {
                    selected[i].$selected = false;
                    this.vm.onRoleSelect(selected[i]);
                }
                $injector.get('$window').sessionStorage.clear();
            });
        });

        it('should set supervisoryNodes', function() {
            expect(this.vm.supervisoryNodes).toEqual(this.supervisoryNodes);
        });

        it('should set warehouses', function() {
            expect(this.vm.warehouses).toEqual(this.warehouses);
        });

        it('should set programs', function() {
            expect(this.vm.programs).toEqual(this.programs);
        });

        it('should set selectedType', function() {
            expect(this.vm.selectedType).toEqual(this.ROLE_TYPES.SUPERVISION);
        });

        it('should set roleAssignments', function() {
            expect(this.vm.roleAssignments.length).toBe(2);
            expect(this.vm.roleAssignments[0]).toEqual(this.user.roleAssignments[0]);
            expect(this.vm.roleAssignments[1]).toEqual(this.user.roleAssignments[1]);
        });

        it('should set filteredRoles', function() {
            expect(this.vm.filteredRoles).toEqual(this.roles);
        });

        it('should set showErrorColumn to false if role assignments does not have errors', function() {
            expect(this.vm.showErrorColumn).toEqual(false);
        });

        it('should set showErrorColumn to true if role assignments have errors', function() {
            this.vm.roleAssignments[0].errors = ['error'];

            this.vm.$onInit();
            this.$rootScope.$apply();

            expect(this.vm.showErrorColumn).toEqual(true);
        });

        it('should set editable to false', function() {
            expect(this.vm.editable).toEqual(true);
        });

        it('should expose roleRightsMap', function() {
            this.vm.$onInit();
            this.$rootScope.$apply();

            expect(this.vm.roleRightsMap).toEqual(this.roleRightsMap);
        });

        it('should get all selected roles', function() {
            this.vm.roleAssignments[0].$selected = true;
    
            var selectedroleAssignments = this.vm.getSelected();
    
            expect(selectedroleAssignments).toEqual([this.vm.roleAssignments[0]]);
        });
        
        it('should get an empty array if no roles are selected', function() {
            var selectedValidDestinations = this.vm.getSelected();
    
            expect(selectedValidDestinations).toEqual([]);
        });
    });

    describe('addRole', function() {

        it('should return promise', function() {
            expect(angular.isFunction(this.vm.addRole().then)).toBe(true);
        });

        it('should display error notification if role is already assigned', function() {
            var roleAssignmentsCount = this.user.roleAssignments.length;

            this.vm.selectedRole = this.roles[0];
            this.vm.selectedProgram = this.programs[0];
            this.vm.selectedSupervisoryNode = this.supervisoryNodes[0];

            this.vm.addRole();

            expect(this.user.roleAssignments.length).toEqual(roleAssignmentsCount);
            expect(this.notificationService.error).toHaveBeenCalledWith('referencedataRoles.roleAlreadyAssigned');
        });

        it('should add role without supervisory node if the same role with supervisory node already exists',
            function() {
                var roleAssignmentsCount = this.user.roleAssignments.length;

                this.vm.selectedRole = this.roles[0];
                this.vm.selectedProgram = this.programs[0];
                this.vm.selectedSupervisoryNode = undefined;

                this.vm.addRole();

                expect(this.user.roleAssignments.length).toEqual(roleAssignmentsCount + 1);
            });

        it('should allow to add home facility role if user has no home facility', function() {
            var roleAssignmentsCount = this.user.roleAssignments.length;

            this.vm.selectedRole = this.roles[1];
            this.vm.selectedProgram = this.programs[1];
            this.user.homeFacilityId = undefined;

            this.vm.addRole();

            expect(this.user.roleAssignments.length).toEqual(roleAssignmentsCount + 1);
            expect(this.notificationService.error)
                .not.toHaveBeenCalledWith('referencedataRoles.homeFacilityRoleInvalid');
        });

        it('should add new supervision role assignment', function() {
            var roleAssignmentsCount = this.user.roleAssignments.length;

            this.vm.selectedRole = this.roles[1];
            this.vm.selectedProgram = this.programs[1];
            this.vm.selectedSupervisoryNode = this.supervisoryNodes[1];

            this.vm.addRole();

            expect(this.user.roleAssignments.length).toEqual(roleAssignmentsCount + 1);
            expect(this.notificationService.error).not.toHaveBeenCalled();
            expect(this.user.roleAssignments[roleAssignmentsCount].roleId).toEqual(this.roles[1].id);
            expect(this.user.roleAssignments[roleAssignmentsCount].roleName).toEqual(this.roles[1].name);
            expect(this.user.roleAssignments[roleAssignmentsCount].programName).toEqual(this.programs[1].name);
            expect(this.user.roleAssignments[roleAssignmentsCount].supervisoryNodeName)
                .toEqual('Supervisory Node (Facility)');
        });
    });

    describe('removeRole', function() {
        beforeEach(function() {
            this.confirmService.confirmDestroy.andReturn(this.$q.when(true));
            this.roleAssignmentsCount = this.user.roleAssignments.length;
        });

        it('should show confirm modal', function() {
            this.vm.removeRole(this.user.roleAssignments[0]);

            expect(this.confirmService.confirmDestroy)
                .toHaveBeenCalledWith('adminUserRoles.removeRole.question', 'adminUserRoles.removeRole.label');
        });

        it('should remove role assignment if it exists', function() {
            this.vm.removeRole(this.user.roleAssignments[0]);
            this.$rootScope.$apply();

            expect(this.user.roleAssignments.length).toEqual(this.roleAssignmentsCount - 1);
        });

        it('should not remove role assignment if it does not exists', function() {
            this.vm.removeRole('roleAssignment');
            this.$rootScope.$apply();

            expect(this.user.roleAssignments.length).toEqual(this.roleAssignmentsCount);
        });
    });
    
    it('should set "select all" option when all roles are selected by user', function() {
        for (var i = 0; i < this.vm.roleAssignments.length; i++) {
            this.vm.roleAssignments[i].$selected = true;
            this.vm.onRoleSelect(this.vm.roleAssignments[i]);
        }

        this.vm.setSelectAll();

        expect(this.vm.selectAll).toBe(true);
    });      
    // MALAWISUP-3888: Ends here
});