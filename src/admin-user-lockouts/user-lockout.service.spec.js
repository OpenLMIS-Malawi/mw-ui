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

describe('userLockoutService', function() {

    beforeEach(function() {
        module('admin-user-lockouts');

        inject(function($injector) {
            this.userLockoutService = $injector.get('userLockoutService');
            this.$httpBackend = $injector.get('$httpBackend');
            this.openlmisUrlFactory = $injector.get('openlmisUrlFactory');
        });

        this.ids = ['id-one', 'id-two'];
        this.response = {
            unlocked: ['id-one'],
            notFound: ['id-two'],
            failed: []
        };
    });

    afterEach(function() {
        this.$httpBackend.verifyNoOutstandingExpectation();
        this.$httpBackend.verifyNoOutstandingRequest();
    });

    it('should POST the ids to the unlock endpoint and resolve with the response', function() {
        var result;

        this.$httpBackend
            .expectPOST(this.openlmisUrlFactory('/api/users/auth/unlock'), this.ids)
            .respond(200, this.response);

        this.userLockoutService.unlock(this.ids).then(function(data) {
            result = data;
        });

        this.$httpBackend.flush();

        expect(result).toEqual(this.response);
    });
});
