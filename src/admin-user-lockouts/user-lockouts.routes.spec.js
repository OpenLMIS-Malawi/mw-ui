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

describe('openlmis.administration.users.lockouts state', function() {

    beforeEach(function() {
        // admin-user-list registers the parent openlmis.administration.users state; without
        // it ui-router defers (never registers) this child state.
        module('admin-user-list', 'admin-user-lockouts');

        inject(function($injector) {
            this.$state = $injector.get('$state');
            this.$q = $injector.get('$q');
            this.ADMINISTRATION_RIGHTS = $injector.get('ADMINISTRATION_RIGHTS');
            this.UserRepository = $injector.get('UserRepository');
            this.paginationService = $injector.get('paginationService');
        });

        this.state = this.$state.get('openlmis.administration.users.lockouts');
    });

    it('should be registered with the lockouts url', function() {
        expect(this.state).not.toBeUndefined();
        expect(this.state.url).toContain('/lockouts');
    });

    it('should be a tab on the users page, not a separate navigation entry', function() {
        expect(this.state.showInNavigation).toBe(false);
        expect(this.state.label).toEqual('adminUserLockouts.lockouts.label');
    });

    it('should require USERS_MANAGE right to enter', function() {
        expect(this.state.accessRights).toEqual([this.ADMINISTRATION_RIGHTS.USERS_MANAGE]);
    });

    it('should render into the users page ui-view', function() {
        expect(this.state.controller).toEqual('UserLockoutsController');
        expect(this.state.templateUrl).toEqual('admin-user-lockouts/user-lockouts.html');
    });

    it('should query only locked-out users', function() {
        var context = this;
        var page = {
            content: []
        };

        spyOn(this.UserRepository.prototype, 'query').andReturn(this.$q.when(page));
        spyOn(this.paginationService, 'registerUrl').andCallFake(function(stateParams, fn) {
            return fn(stateParams);
        });

        inject(function($injector) {
            $injector.invoke(context.state.resolve.users, null, {
                $stateParams: {
                    sort: 'username'
                }
            });
        });

        expect(this.UserRepository.prototype.query).toHaveBeenCalledWith({
            sort: 'username',
            lockedOut: true
        });
    });
});
