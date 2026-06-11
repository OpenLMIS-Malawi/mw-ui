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

describe('UserLockoutSummaryModalController', function() {

    beforeEach(function() {
        module('admin-user-lockouts');

        inject(function($injector) {
            this.$controller = $injector.get('$controller');
            this.$q = $injector.get('$q');
        });

        this.summary = {
            unlocked: ['id-one'],
            notFound: ['id-two'],
            failed: ['id-three']
        };
        this.usernamesById = {
            'id-one': 'userOne'
        };
        this.modalDeferred = this.$q.defer();

        this.vm = this.$controller('UserLockoutSummaryModalController', {
            summary: this.summary,
            usernamesById: this.usernamesById,
            modalDeferred: this.modalDeferred
        });
        this.vm.$onInit();
    });

    it('should build the three sections with their users', function() {
        expect(this.vm.sections.length).toBe(3);
        expect(this.vm.sections[0].key).toBe('unlocked');
        expect(this.vm.sections[1].key).toBe('notFound');
        expect(this.vm.sections[2].key).toBe('failed');
    });

    it('should resolve cached usernames and fall back to the id', function() {
        expect(this.vm.sections[0].users).toEqual([{
            id: 'id-one',
            username: 'userOne'
        }]);

        expect(this.vm.sections[1].users).toEqual([{
            id: 'id-two',
            username: undefined
        }]);
    });

    it('should start with all sections collapsed', function() {
        expect(this.vm.isExpanded('unlocked')).toBe(false);
        expect(this.vm.isExpanded('notFound')).toBe(false);
        expect(this.vm.isExpanded('failed')).toBe(false);
    });

    it('should toggle a section open and closed', function() {
        this.vm.toggle('unlocked');

        expect(this.vm.isExpanded('unlocked')).toBe(true);

        this.vm.toggle('unlocked');

        expect(this.vm.isExpanded('unlocked')).toBe(false);
    });

    it('should resolve the modal deferred on close', function() {
        var resolved = false;
        this.modalDeferred.promise.then(function() {
            resolved = true;
        });

        this.vm.close();
        inject(function($rootScope) {
            $rootScope.$apply();
        });

        expect(resolved).toBe(true);
    });
});
