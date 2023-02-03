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
     * @ngdoc service
     * @name report.supersetUrlFactory
     *
     * @description
     * A factory that prepends URL required to get access to Superset.
     */
    angular
        .module('report')
        .factory('supersetUrlFactory', supersetUrlFactory);

    supersetUrlFactory.$inject = ['authUrl', 'SUPERSET_URL'];

    function supersetUrlFactory(authUrl, SUPERSET_URL) {
        // MW-1234: The SuperSet Upgrade
        var supersetURL = (new URL(SUPERSET_URL));
        var supersetDomain = supersetURL.hostname;
        var redirectUrl= 'http://' + supersetDomain + '/oauth-authorized/openlmis';
        // MW-1234: ends here
            factory = {
                buildSupersetOAuthRequestUrl: buildSupersetOAuthRequestUrl,
                buildApproveSupersetUrl: buildApproveSupersetUrl,
                buildCheckSupersetAuthorizationUrl: buildCheckSupersetAuthorizationUrl
            };

        return factory;

        /**
         * @ngdoc method
         * @methodOf report.supersetUrlFactory
         * @name buildSupersetOAuthRequestUrl
         *
         * @description
         * Prepares an URL for creating Superset OAuth request in OpenLMIS.

         * @param   {String}    supersetOAuthState  the state from Superset to append as an url parameter
         * @return  {String}                        url that is directed towards the OpenLMIS Auth
         */
        function buildSupersetOAuthRequestUrl(supersetOAuthState) {
            var url = '/api/oauth/authorize?response_type=code&client_id=superset'
                    + '&redirect_uri=' + redirectUrl
                    + '&scope=read+write&state=' + supersetOAuthState;
            return authUrl(url);
        }

        /**
         * @ngdoc method
         * @methodOf report.supersetUrlFactory
         * @name buildApproveSupersetUrl
         *
         * @description
         * Prepares URL which allows approving the Superset application in OpenLMIS.

         * @return  {String}    url that is directed towards the OpenLMIS Auth
         */
        function buildApproveSupersetUrl() {
            // MW-1234: The SuperSet Upgrade
            var supersetURL = (new URL(SUPERSET_URL));
            var supersetDomain = supersetURL.hostname;
            var redirectUrl= 'http://' + supersetDomain + '/oauth-authorized/openlmis'; 
            // MW-1234: ends here
            var url = '/api/oauth/authorize?response_type=code&client_id=superset'
                    + '&redirect_uri=' + redirectUrl;
            return authUrl(url);
        }

        /**
         * @ngdoc method
         * @methodOf report.supersetUrlFactory
         * @name buildCheckSupersetAuthorizationUrl
         *
         * @description
         * Prepares URL which allows to check user authorization and init OAuth Request in Superset.

         * @return  {String}    url that is directed towards Superset
         */
        function buildCheckSupersetAuthorizationUrl() {
            // MW-1234: The SuperSet Upgrade 
            var supersetURL = (new URL(SUPERSET_URL));
            var supersetDomain = supersetURL.hostname;
            var redirectUrl= 'http://' + supersetDomain + '/oauth-authorized/openlmis'; 
            // MW-1234: ends here
            return SUPERSET_URL + '/oauth-init/openlmis?redirect_url=' + redirectUrl;
        }
    }

})();
