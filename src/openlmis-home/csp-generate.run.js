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
 * MALAWISUP-7386 — TEMPORARY OVERRIDE of openlmis-ui-layout.
 *
 * Copied verbatim from openlmis/ui-layout:5.2.10 with a single change:
 * `data:` added to the CSP img-src directive.
 *
 * Why: dev-ui's webpack url-loader runs with `limit: 8192`, so any SCSS-referenced
 * image under 8 KB is inlined as a data: URI at build time. The generated CSP did
 * not allow the data: scheme, so the Malawi header logo (logo-header.png, 4564 B)
 * was blocked.
 *
 * DELETE THIS FILE once docker-compose.yml pins openlmis/ui-layout >= 5.2.11,
 * which contains the same change. Keeping it after that point would silently
 * shadow any newer core changes to csp-generate.run.js.
 */

(function() {

    'use strict';

    angular
        .module('openlmis-home')
        .run(run);

    run.$inject = [];

    function run() {
        var GOOGLE_ANALYTICS_URL = 'www.google-analytics.com';
        var SUPERSET_URL = '${SUPERSET_URL}';

        // Get external domains from the environment variable.
        // If the environment variable is a placeholder, return an empty array.
        // Otherwise, return the list of domains.
        function getExternalDomains() {
            var envDomains = '${EXTERNAL_DOMAINS}';

            var validDomains = ensureValidEnvVariable(envDomains);

            var externalDomains = validDomains
                .split(',')
                .map((domain) => domain.trim())
                .filter((domain) => domain);

            if (ensureValidEnvVariable(SUPERSET_URL)) {
                externalDomains.push(SUPERSET_URL.trim());
            }

            return externalDomains;
        }

        // Check if the environment variable is a placeholder.
        // If so return an empty string, otherwise return the value.
        function ensureValidEnvVariable(envVariable) {
            if (envVariable.substr(0, 2) === '${') {
                return '';
            }

            return envVariable;
        }

        // Generate the Content Security Policy header.
        // This header will allow scripts and styles from the current domain and external domains.
        function getCSPTag() {
            var externalDomains = getExternalDomains();
            var joinedDomains = externalDomains.join(' ');

            var cspHeader =
                'default-src \'self\' ' + joinedDomains + ' \'unsafe-inline\';\n' +
                'img-src \'self\' data: ' + GOOGLE_ANALYTICS_URL + ';\n' +
                'script-src \'self\' ' + GOOGLE_ANALYTICS_URL + ' \'unsafe-inline\' \'unsafe-eval\';\n' +
                'connect-src \'self\' ' + GOOGLE_ANALYTICS_URL + ' ' + joinedDomains + ';\n' +
                'frame-src \'self\' ' + joinedDomains + ';';

            return cspHeader;
        }

        function addCSPTag() {
            var cspContent = getCSPTag();
            var metaTag = document.createElement('meta');
            metaTag.setAttribute('http-equiv', 'Content-Security-Policy');
            metaTag.setAttribute('content', cspContent);
            document.head.appendChild(metaTag);
        }

        addCSPTag();
    }

})();
