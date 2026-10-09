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

describe('requisition batch approval guard', function() {

    var $rootScope, $state, featureFlagService, loadingModalService, BATCH_APPROVE_SCREEN_FEATURE_FLAG,
        batchApprovalState, otherState;

    beforeEach(function() {
        module('openlmis-main-state');
        module('requisition-batch-approval', function($provide) {
            featureFlagService = jasmine.createSpyObj('featureFlagService', ['get', 'set']);
            $provide.value('featureFlagService', featureFlagService);
        });

        inject(function($injector) {
            $rootScope = $injector.get('$rootScope');
            $state = $injector.get('$state');
            loadingModalService = $injector.get('loadingModalService');
            BATCH_APPROVE_SCREEN_FEATURE_FLAG = $injector.get('BATCH_APPROVE_SCREEN_FEATURE_FLAG');
        });

        batchApprovalState = {
            name: 'openlmis.requisitions.batchApproval'
        };
        otherState = {
            name: 'openlmis.requisitions.approvalList'
        };

        spyOn($state, 'go');
        spyOn(loadingModalService, 'close');
    });

    it('should redirect to the approval list if batch approve screen is disabled', function() {
        featureFlagService.get.andReturn(false);

        var event = $rootScope.$broadcast('$stateChangeStart', batchApprovalState, {});

        expect(featureFlagService.get).toHaveBeenCalledWith(BATCH_APPROVE_SCREEN_FEATURE_FLAG);
        expect(event.defaultPrevented).toBe(true);
        expect(loadingModalService.close).toHaveBeenCalled();
        expect($state.go).toHaveBeenCalledWith('openlmis.requisitions.approvalList');
    });

    it('should allow entering batch approval if batch approve screen is enabled', function() {
        featureFlagService.get.andReturn(true);

        var event = $rootScope.$broadcast('$stateChangeStart', batchApprovalState, {});

        expect(event.defaultPrevented).toBe(false);
        expect($state.go).not.toHaveBeenCalled();
    });

    it('should not affect other states', function() {
        featureFlagService.get.andReturn(false);

        var event = $rootScope.$broadcast('$stateChangeStart', otherState, {});

        expect(event.defaultPrevented).toBe(false);
        expect($state.go).not.toHaveBeenCalled();
    });
});
