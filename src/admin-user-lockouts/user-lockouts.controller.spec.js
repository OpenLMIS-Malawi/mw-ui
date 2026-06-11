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

describe('UserLockoutsController', function() {

    beforeEach(function() {
        this.confirmService = jasmine.createSpyObj('confirmService', ['confirm']);
        this.messageService = jasmine.createSpyObj('messageService', ['get']);
        this.openlmisModalService = jasmine.createSpyObj('openlmisModalService', ['createDialog']);
        this.userLockoutService = jasmine.createSpyObj('userLockoutService', ['unlock']);
        this.userLockoutSelectionService = jasmine.createSpyObj('userLockoutSelectionService', [
            'set', 'isSelected', 'getSelected', 'getSelectedIds', 'getUsernamesById', 'count', 'clear'
        ]);
        this.loadingModalService = jasmine.createSpyObj('loadingModalService', ['open', 'close']);

        var context = this;
        module('admin-user-lockouts', function($provide) {
            $provide.service('confirmService', function() {
                return context.confirmService;
            });
            $provide.service('messageService', function() {
                return context.messageService;
            });
            $provide.service('openlmisModalService', function() {
                return context.openlmisModalService;
            });
            $provide.service('userLockoutService', function() {
                return context.userLockoutService;
            });
            $provide.service('userLockoutSelectionService', function() {
                return context.userLockoutSelectionService;
            });
            $provide.service('loadingModalService', function() {
                return context.loadingModalService;
            });
        });

        inject(function($injector) {
            this.$controller = $injector.get('$controller');
            this.$rootScope = $injector.get('$rootScope');
            this.$state = $injector.get('$state');
            this.$q = $injector.get('$q');
        });

        this.users = [
            {
                id: 'id-one',
                username: 'userOne',
                firstName: 'User',
                lastName: 'One',
                email: 'one@openlmis.org'
            },
            {
                id: 'id-two',
                username: 'userTwo',
                firstName: 'User',
                lastName: 'Two',
                email: 'two@openlmis.org'
            }
        ];

        this.stateParams = {
            firstName: 'User',
            lastName: 'One',
            username: 'userOne',
            email: 'one@openlmis.org'
        };

        this.messageService.get.andReturn('Unlock 1 users?');

        this.vm = this.$controller('UserLockoutsController', {
            users: this.users,
            $stateParams: this.stateParams
        });
        this.vm.$onInit();

        spyOn(this.$state, 'go').andReturn();
        spyOn(this.$state, 'reload').andReturn();
    });

    describe('onInit', function() {

        it('should expose users and filters', function() {
            expect(this.vm.users).toEqual(this.users);
            expect(this.vm.firstName).toEqual('User');
            expect(this.vm.lastName).toEqual('One');
            expect(this.vm.username).toEqual('userOne');
            expect(this.vm.email).toEqual('one@openlmis.org');
        });
    });

    it('should expose sort options matching the Users tab', function() {
        expect(this.vm.options).toEqual({
            'adminUserLockouts.firstName': ['firstName'],
            'adminUserLockouts.lastName': ['lastName'],
            'adminUserLockouts.username': ['username']
        });
    });

    describe('search', function() {

        it('should reload the lockouts state with the filter values', function() {
            this.vm.username = 'changed';

            this.vm.search();

            expect(this.$state.go).toHaveBeenCalledWith(
                'openlmis.administration.users.lockouts',
                jasmine.objectContaining({
                    username: 'changed',
                    firstName: 'User',
                    lastName: 'One',
                    email: 'one@openlmis.org'
                }),
                {
                    reload: true
                }
            );
        });
    });

    describe('selection', function() {

        it('should seed each row checkbox from the persisted selection on init', function() {
            expect(this.userLockoutSelectionService.isSelected).toHaveBeenCalledWith('id-one');
            expect(this.userLockoutSelectionService.isSelected).toHaveBeenCalledWith('id-two');
        });

        it('should persist a row checkbox change into the selection service', function() {
            this.users[0].selected = true;

            this.vm.toggle(this.users[0]);

            expect(this.userLockoutSelectionService.set).toHaveBeenCalledWith(this.users[0], true);
        });

        it('should report a selection when at least one user is selected', function() {
            this.userLockoutSelectionService.count.andReturn(1);

            expect(this.vm.hasSelection()).toBe(true);

            this.userLockoutSelectionService.count.andReturn(0);

            expect(this.vm.hasSelection()).toBe(false);
        });
    });

    describe('save', function() {

        beforeEach(function() {
            this.confirmDeferred = this.$q.defer();
            this.dialogDeferred = this.$q.defer();
            this.summary = {
                unlocked: ['id-one'],
                notFound: [],
                failed: []
            };

            this.confirmService.confirm.andReturn(this.confirmDeferred.promise);
            this.userLockoutService.unlock.andReturn(this.$q.when(this.summary));
            this.userLockoutSelectionService.getSelected.andReturn([this.users[0]]);
            this.userLockoutSelectionService.getSelectedIds.andReturn(['id-one']);
            this.userLockoutSelectionService.getUsernamesById.andReturn({
                'id-one': 'userOne'
            });
            this.openlmisModalService.createDialog.andReturn({
                promise: this.dialogDeferred.promise
            });
        });

        it('should ask for confirmation before unlocking', function() {
            this.vm.save();

            expect(this.confirmService.confirm).toHaveBeenCalled();
            expect(this.userLockoutService.unlock).not.toHaveBeenCalled();
        });

        it('should unlock the selected ids and open the summary modal after confirmation', function() {
            this.vm.save();
            this.confirmDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.userLockoutService.unlock).toHaveBeenCalledWith(['id-one']);
            expect(this.openlmisModalService.createDialog).toHaveBeenCalled();
        });

        it('should clear the selection and reload after the summary modal closes', function() {
            this.vm.save();
            this.confirmDeferred.resolve();
            this.$rootScope.$apply();

            this.dialogDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.userLockoutSelectionService.clear).toHaveBeenCalled();
            expect(this.$state.reload).toHaveBeenCalled();
        });

        it('should not unlock when the confirmation is rejected', function() {
            this.vm.save();
            this.confirmDeferred.reject();
            this.$rootScope.$apply();

            expect(this.userLockoutService.unlock).not.toHaveBeenCalled();
        });
    });
});
