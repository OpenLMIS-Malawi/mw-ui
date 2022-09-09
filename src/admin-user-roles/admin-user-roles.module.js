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

(function() {

    'use strict';

    /**
     * @module admin-user-roles
     *
     * @description
     * Provides add/remove user roles screen.
     */
    angular.module('admin-user-roles', [
        'mgcrea.ngStrap.tab',
        'openlmis-modal',
        'openlmis-pagination',
        'openlmis-rights',
        'referencedata-facility',
        'referencedata-program',
        'referencedata-role',
        'referencedata-supervisory-node',
        'referencedata-user',
        'ui.router',
        'admin-user-list',
        'openlmis-admin',
        'admin-role-form',
        'openlmis-object-utils',
        // MALAWISUP-3888 Add checkboxes and column filters under roles when removing users roles: Starts here
        'openlmis-uuid'
        // MALAWISUP-3888: Ends here
    ]);

})();