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

/*
 * MALAWISUP-7386 - TEMPORARY OVERRIDE of openlmis-referencedata-ui.
 *
 * Copied verbatim from openlmis/referencedata-ui:5.6.20-SNAPSHOT.
 * Upstream fix: MW-1449 (2248c7ba).
 *
 * Completes MW-1449 Superset embedded dashboards: adds the Embedded SDK /
 * guest-token render path and the embeddedUuid field on the report admin screen.
 * Without it every Superset report falls back to /oauth-init/openlmis.
 *
 * DELETE THIS FILE once docker-compose.yml pins openlmis/referencedata-ui >= 5.6.20,
 * which contains the same change. Keeping it after that point would silently
 * shadow newer core changes to this file.
 */

(function() {

    'use strict';

    /**
     * @module openlmis-home-page-report
     *
     * @description
     * Responsible for displaying dashboard home page report
     */
    angular.module('openlmis-home-page-report', [
        'report-dashboard',
        'openlmis-superset',
        'openlmis-urls',
        'openlmis-i18n'
    ]);
})();
