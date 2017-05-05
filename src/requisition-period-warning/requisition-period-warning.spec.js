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

describe('RequisitionPeriodWarning', function () {

    var vm, requisition, confirmService;

    beforeEach(module('requisition-view'));

    beforeEach(module("openlmis-config", function($provide){
        $provide.constant('REQUISITION_WARNING_PROGRAM_CODE', 'CODE');
        $provide.constant('REQUISITION_WARNING_PERIODS', ['Jan','May']);

        $provide.service('authorizationService', function() {
            return jasmine.createSpyObj('authorizationService', ['hasRight']);
        });

        $provide.service('accessTokenFactory', function() {
            return jasmine.createSpyObj('accessTokenFactory', ['addAccessToken']);
        });
    }));

    beforeEach(function(){
        requisition = jasmine.createSpyObj('requisition',
            ['$isSubmitted', '$submit']);
        requisition.program = {};
        requisition.processingPeriod = {};
    });

    beforeEach(inject(function($controller, $rootScope, _confirmService_){
        confirmService = _confirmService_;
        spyOn(confirmService, 'confirm').andReturn({
            'then': function(){}
        });

        vm = $controller('RequisitionViewController', {
            $scope: $rootScope.$new(),
            requisition: requisition
        });
    }));

    it('shows alternate warning when program code and period match', function(){
        var altMessageKey = "requisitionPeriodWarning.confirm";
        var originalMessageKey = "requisitionView.submit.confirm";

        requisition.processingPeriod.name = "Feb";
        requisition.program.code = "Not CODE";

        vm.submitRnr();
        expect(confirmService.confirm.mostRecentCall.args[0]).toEqual(originalMessageKey);

        requisition.processingPeriod.name = "Jan2017";
        requisition.program.code = "CODE";

        vm.submitRnr();
        expect(confirmService.confirm.mostRecentCall.args[0]).toEqual(altMessageKey);    
    });

});
