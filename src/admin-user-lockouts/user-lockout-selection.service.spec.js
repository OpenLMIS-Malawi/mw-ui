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

describe('userLockoutSelectionService', function() {

    beforeEach(function() {
        module('admin-user-lockouts');

        inject(function($injector) {
            this.userLockoutSelectionService = $injector.get('userLockoutSelectionService');
        });

        this.userOne = {
            id: 'id-one',
            username: 'userOne'
        };
        this.userTwo = {
            id: 'id-two',
            username: 'userTwo'
        };

        // The service is a singleton - make sure each test starts clean.
        this.userLockoutSelectionService.clear();
    });

    describe('set', function() {

        it('should add a user when selected is true', function() {
            this.userLockoutSelectionService.set(this.userOne, true);

            expect(this.userLockoutSelectionService.isSelected(this.userOne.id)).toBe(true);
        });

        it('should remove a user when selected is false', function() {
            this.userLockoutSelectionService.set(this.userOne, true);
            this.userLockoutSelectionService.set(this.userOne, false);

            expect(this.userLockoutSelectionService.isSelected(this.userOne.id)).toBe(false);
        });
    });

    it('should expose the selected users', function() {
        this.userLockoutSelectionService.set(this.userOne, true);
        this.userLockoutSelectionService.set(this.userTwo, true);

        expect(this.userLockoutSelectionService.getSelected()).toEqual([this.userOne, this.userTwo]);
        expect(this.userLockoutSelectionService.getSelectedIds()).toEqual([this.userOne.id, this.userTwo.id]);
        expect(this.userLockoutSelectionService.count()).toBe(2);
    });

    it('should expose a username by id map', function() {
        this.userLockoutSelectionService.set(this.userOne, true);

        expect(this.userLockoutSelectionService.getUsernamesById()).toEqual({
            'id-one': 'userOne'
        });
    });

    it('should clear the selection', function() {
        this.userLockoutSelectionService.set(this.userOne, true);

        this.userLockoutSelectionService.clear();

        expect(this.userLockoutSelectionService.count()).toBe(0);
    });
});
