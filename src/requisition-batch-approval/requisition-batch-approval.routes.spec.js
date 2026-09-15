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

describe('openlmis.requisitions.batchApproval state', function() {

    var $q, $state, $rootScope, requisitionBatchApprovalService, requisitionService, offlineService, state,
        $stateParams, requisitions, REQUISITION_RIGHTS;

    beforeEach(function() {
        loadModules();
        injectServices();
        prepareTestData();
        prepareSpies();
    });

    it('should accept ids through query params', function() {
        expect(state.url.split('?')[1].indexOf('ids')).toBeGreaterThan(-1);
    });

    it('should require REQUISITION_RIGHTS right to enter', function() {
        expect(state.accessRights).toEqual([REQUISITION_RIGHTS.REQUISITION_APPROVE]);
    });

    it('should fetch a list of requisitions', function() {
        expect(resolveRequisitions()).toEqual(requisitions);
        expect(requisitionBatchApprovalService.get).toHaveBeenCalledWith(['1', '2']);
    });

    it('should filter out requisitions the user is not the approver for', function() {
        requisitionService.forApproval.andReturn($q.resolve(pageOf([{
            id: 2
        }])));

        expect(resolveRequisitions()).toEqual([{
            id: 2
        }]);
    });

    it('should filter out all requisitions if none of them awaits the user approval', function() {
        requisitionService.forApproval.andReturn($q.resolve(pageOf([])));

        expect(resolveRequisitions()).toEqual([]);
    });

    it('should fetch all pages of requisitions awaiting the user approval', function() {
        requisitionService.forApproval.andCallFake(function(params) {
            if (params.page === 0) {
                return $q.resolve(pageOf([{
                    id: 1
                }], 2));
            }
            return $q.resolve(pageOf([{
                id: 2
            }], 2));
        });

        expect(resolveRequisitions()).toEqual(requisitions);
        expect(requisitionService.forApproval.calls.length).toBe(2);
    });

    it('should not filter requisitions while offline', function() {
        offlineService.isOffline.andReturn(true);

        expect(resolveRequisitions()).toEqual(requisitions);
        expect(requisitionService.forApproval).not.toHaveBeenCalled();
    });

    function resolveRequisitions() {
        var result;

        state.resolve.requisitions(
            $stateParams, requisitionBatchApprovalService, $q, requisitionService, offlineService
        )
            .then(function(response) {
                result = response;
            });
        $rootScope.$apply();

        return result;
    }

    function pageOf(content, totalPages) {
        return {
            content: content,
            totalPages: totalPages === undefined ? 1 : totalPages
        };
    }

    function loadModules() {
        module('openlmis-main-state');
        module('requisition-batch-approval');
    }

    function injectServices() {
        inject(function($injector) {
            $q = $injector.get('$q');
            $state = $injector.get('$state');
            $rootScope = $injector.get('$rootScope');
            REQUISITION_RIGHTS = $injector.get('REQUISITION_RIGHTS');
        });
    }

    function prepareTestData() {
        state = $state.get('openlmis.requisitions.batchApproval');
        $stateParams = {
            ids: '1,2'
        };
        requisitions = [{
            id: 1
        }, {
            id: 2
        }];
    }

    function prepareSpies() {
        requisitionBatchApprovalService = jasmine.createSpyObj('requisitionBatchApprovalService', ['get']);
        requisitionBatchApprovalService.get.andReturn($q.resolve(requisitions));

        requisitionService = jasmine.createSpyObj('requisitionService', ['forApproval']);
        requisitionService.forApproval.andReturn($q.resolve(pageOf([{
            id: 1
        }, {
            id: 2
        }])));

        offlineService = jasmine.createSpyObj('offlineService', ['isOffline']);
        offlineService.isOffline.andReturn(false);
    }
});
