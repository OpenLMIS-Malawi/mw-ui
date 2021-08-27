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

describe('proofOfDeliveryService', function() {

    var PROOF_OF_DELIVERY_ID = 'proof-of-delivery-id';

    var proofOfDeliveryService, ProofOfDeliveryDataBuilder, $q, $rootScope, repositoryMock,
        loadingModalService, notificationService, proofOfDeliveryMock, saveSpy, confirmSpy,
        confirmService, stateTrackerService;

    beforeEach(function() {
        module('proof-of-delivery-view', function($provide) {
            $provide.factory('ProofOfDeliveryRepository', function() {
                return function() {
                    repositoryMock = jasmine.createSpyObj('ProofOfDeliveryRepository', ['get']);
                    return repositoryMock;
                };
            });
        });

        inject(function($injector) {
            $q = $injector.get('$q');
            $rootScope = $injector.get('$rootScope');
            proofOfDeliveryService = $injector.get('proofOfDeliveryService');
            ProofOfDeliveryDataBuilder = $injector.get('ProofOfDeliveryDataBuilder');
            loadingModalService = $injector.get('loadingModalService');
            notificationService = $injector.get('notificationService');
            confirmService = $injector.get('confirmService');
            stateTrackerService = $injector.get('stateTrackerService');
        });
    });

    describe('get', function() {

        it('should return domain object', function() {
            var proofOfDelivery = new ProofOfDeliveryDataBuilder().build();
            repositoryMock.get.andReturn($q.resolve(proofOfDelivery));

            var result;
            proofOfDeliveryService.get(PROOF_OF_DELIVERY_ID)
                .then(function(proofOfDelivery) {
                    result = proofOfDelivery;
                });
            $rootScope.$apply();

            expect(result).toEqual(proofOfDelivery);
            expect(repositoryMock.get).toHaveBeenCalledWith(PROOF_OF_DELIVERY_ID);
        });

        it('should decorate save', function() {
            proofOfDeliveryMock = jasmine.createSpyObj('proofOfDeliveryMock', ['save']);
            repositoryMock.get.andReturn($q.resolve(proofOfDeliveryMock));

            saveSpy = proofOfDeliveryMock.save;

            var result;
            proofOfDeliveryService.get(PROOF_OF_DELIVERY_ID)
                .then(function(proofOfDelivery) {
                    result = proofOfDelivery;
                });
            $rootScope.$apply();

            expect(result.save).not.toBe(saveSpy);
        });

        it('should decorate confirm', function() {
            proofOfDeliveryMock = jasmine.createSpyObj('proofOfDeliveryMock', ['save']);
            repositoryMock.get.andReturn($q.resolve(proofOfDeliveryMock));

            confirmSpy = proofOfDeliveryMock.confirm;

            var result;
            proofOfDeliveryService.get(PROOF_OF_DELIVERY_ID)
                .then(function(proofOfDelivery) {
                    result = proofOfDelivery;
                });
            $rootScope.$apply();

            expect(result.confirm).not.toBe(confirmSpy);
        });

        it('should reject if repository rejected', function() {
            repositoryMock.get.andReturn($q.reject());

            var rejected;
            proofOfDeliveryService.get(PROOF_OF_DELIVERY_ID)
                .catch(function() {
                    rejected = true;
                });
            $rootScope.$apply();

            expect(rejected).toEqual(true);
        });

        it('should reject if ID was not given', function() {
            var rejected;
            proofOfDeliveryService.get()
                .catch(function() {
                    rejected = true;
                });
            $rootScope.$apply();

            expect(rejected).toEqual(true);
        });

    });

    describe('decorated save', function() {

        var proofOfDelivery;

        beforeEach(function() {
            proofOfDeliveryMock = jasmine.createSpyObj('proofOfDeliveryMock', ['save']);
            repositoryMock.get.andReturn($q.resolve(proofOfDeliveryMock));

            saveSpy = proofOfDeliveryMock.save;

            proofOfDeliveryService.get(PROOF_OF_DELIVERY_ID)
                .then(function(result) {
                    proofOfDelivery = result;
                });
            $rootScope.$apply();

            spyOn(notificationService, 'success');
            spyOn(notificationService, 'error');
            spyOn(loadingModalService, 'open');
            spyOn(loadingModalService, 'close');
        });

        it('should call original save method', function() {
            saveSpy.andReturn($q.resolve());

            proofOfDelivery.save();

            expect(saveSpy).toHaveBeenCalled();
        });

        it('should show loading modal', function() {
            saveSpy.andReturn($q.resolve());

            proofOfDelivery.save();

            expect(loadingModalService.open).toHaveBeenCalled();
        });

        it('should show success only after save was successful', function() {
            saveSpy.andReturn($q.resolve());

            var saved;
            proofOfDelivery.save()
                .then(function() {
                    saved = true;
                });

            expect(saved).toBeUndefined();
            expect(notificationService.success).not.toHaveBeenCalled();

            $rootScope.$apply();

            expect(saved).toBe(true);
            expect(notificationService.error).not.toHaveBeenCalled();
            expect(notificationService.success)
                .toHaveBeenCalledWith('proofOfDeliveryView.proofOfDeliveryHasBeenSaved');
        });

        it('should close loading modal on success', function() {
            saveSpy.andReturn($q.resolve());

            proofOfDelivery.save();

            expect(loadingModalService.close).not.toHaveBeenCalled();

            $rootScope.$apply();

            expect(loadingModalService.close).toHaveBeenCalled();
        });

        it('should show error only after save has failed', function() {
            saveSpy.andReturn($q.reject());

            var saved;
            proofOfDelivery.save()
                .catch(function() {
                    saved = false;
                });

            expect(saved).toBeUndefined();
            expect(notificationService.error).not.toHaveBeenCalled();

            $rootScope.$apply();

            expect(saved).toBe(false);
            expect(notificationService.success).not.toHaveBeenCalled();
            expect(notificationService.error)
                .toHaveBeenCalledWith('proofOfDeliveryView.failedToSaveProofOfDelivery');
        });

        it('should close loading modal on failure', function() {
            saveSpy.andReturn($q.reject());

            proofOfDelivery.save();

            expect(loadingModalService.close).not.toHaveBeenCalled();

            $rootScope.$apply();

            expect(loadingModalService.close).toHaveBeenCalled();
        });

        it('should resolve to a proof of delivery', function() {
            saveSpy.andReturn($q.resolve(proofOfDelivery));

            var result;
            proofOfDelivery.save()
                .then(function(proofOfDelivery) {
                    result = proofOfDelivery;
                });
            $rootScope.$apply();

            expect(result).toEqual(proofOfDelivery);
        });

    });

    describe('decorated confirm', function() {

        var proofOfDelivery;

        beforeEach(function() {
            proofOfDeliveryMock = jasmine.createSpyObj('proofOfDeliveryMock', ['confirm']);
            repositoryMock.get.andReturn($q.resolve(proofOfDeliveryMock));

            confirmSpy = proofOfDeliveryMock.confirm;

            proofOfDeliveryService.get(PROOF_OF_DELIVERY_ID)
                .then(function(result) {
                    proofOfDelivery = result;
                });
            $rootScope.$apply();

            spyOn(notificationService, 'success');
            spyOn(notificationService, 'error');
            spyOn(loadingModalService, 'open');
            spyOn(loadingModalService, 'close');
            spyOn(confirmService, 'confirm');
            spyOn(stateTrackerService, 'goToPreviousState');
        });

        it('should show confirmation modal before doing anything', function() {
            confirmService.confirm.andReturn($q.resolve());

            proofOfDelivery.confirm();

            expect(confirmService.confirm).toHaveBeenCalledWith(
                'proofOfDeliveryView.confirm.message',
                'proofOfDeliveryView.confirm.label'
            );

            expect(confirmSpy).not.toHaveBeenCalled();
            expect(notificationService.success).not.toHaveBeenCalled();
            expect(notificationService.error).not.toHaveBeenCalled();
            expect(loadingModalService.open).not.toHaveBeenCalled();
            expect(loadingModalService.close).not.toHaveBeenCalled();
        });

        it('should do nothing if without confirmation', function() {
            confirmService.confirm.andReturn($q.reject());

            proofOfDelivery.confirm();
            $rootScope.$apply();

            expect(confirmService.confirm).toHaveBeenCalledWith(
                'proofOfDeliveryView.confirm.message',
                'proofOfDeliveryView.confirm.label'
            );

            expect(confirmSpy).not.toHaveBeenCalled();
            expect(notificationService.success).not.toHaveBeenCalled();
            expect(notificationService.error).not.toHaveBeenCalled();
            expect(loadingModalService.open).not.toHaveBeenCalled();
            expect(loadingModalService.close).not.toHaveBeenCalled();
        });

        it('should call original confirm method', function() {
            confirmService.confirm.andReturn($q.resolve());
            confirmSpy.andReturn($q.resolve());

            proofOfDelivery.confirm();
            $rootScope.$apply();

            expect(confirmSpy).toHaveBeenCalled();
        });

        it('should show loading modal', function() {
            confirmService.confirm.andReturn($q.resolve());
            confirmSpy.andReturn($q.resolve());

            proofOfDelivery.confirm();
            $rootScope.$apply();

            expect(loadingModalService.open).toHaveBeenCalled();
        });

        it('should show success only after confirm was successful', function() {
            confirmService.confirm.andReturn($q.resolve());
            confirmSpy.andReturn($q.resolve());

            var confirmed;
            proofOfDelivery.confirm()
                .then(function() {
                    confirmed = true;
                });

            expect(confirmed).toBeUndefined();
            expect(notificationService.success).not.toHaveBeenCalled();

            $rootScope.$apply();

            expect(confirmed).toBe(true);
            expect(notificationService.error).not.toHaveBeenCalled();
            expect(notificationService.success)
                .toHaveBeenCalledWith('proofOfDeliveryView.proofOfDeliveryHasBeenConfirmed');
        });

        it('should close loading modal on success', function() {
            confirmService.confirm.andReturn($q.resolve());
            confirmSpy.andReturn($q.resolve());

            proofOfDelivery.confirm();

            expect(loadingModalService.close).not.toHaveBeenCalled();

            $rootScope.$apply();

            expect(loadingModalService.close).toHaveBeenCalled();
        });

        it('should go to previous state on success', function() {
            confirmService.confirm.andReturn($q.resolve());
            confirmSpy.andReturn($q.resolve());

            proofOfDelivery.confirm();

            expect(stateTrackerService.goToPreviousState).not.toHaveBeenCalled();

            $rootScope.$apply();

            expect(stateTrackerService.goToPreviousState).toHaveBeenCalledWith('openlmis.orders.podManage');
        });

        it('should show error only after confirm has failed', function() {
            confirmService.confirm.andReturn($q.resolve());
            confirmSpy.andReturn($q.reject());

            var confirmed;
            proofOfDelivery.confirm()
                .catch(function() {
                    confirmed = false;
                });

            expect(confirmed).toBeUndefined();
            expect(notificationService.error).not.toHaveBeenCalled();

            $rootScope.$apply();

            expect(confirmed).toBe(false);
            expect(notificationService.success).not.toHaveBeenCalled();
            expect(notificationService.error)
                .toHaveBeenCalledWith('proofOfDeliveryView.failedToConfirmProofOfDelivery');

            expect(stateTrackerService.goToPreviousState).not.toHaveBeenCalled();
        });

        it('should close loading modal on failure', function() {
            confirmService.confirm.andReturn($q.resolve());
            confirmSpy.andReturn($q.reject());

            proofOfDelivery.confirm();

            expect(loadingModalService.close).not.toHaveBeenCalled();

            $rootScope.$apply();

            expect(loadingModalService.close).toHaveBeenCalled();
            expect(stateTrackerService.goToPreviousState).not.toHaveBeenCalled();
        });

    });

});
