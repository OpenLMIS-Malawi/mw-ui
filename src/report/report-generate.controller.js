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
     * @ngdoc controller
     * @name report.controller:ReportGenerateController
     *
     * @description
     * Controller for report options page.
     */
    angular
        .module('report')
        .controller('ReportGenerateController', controller);

    // MW-1178: Add datepicker & multiple select to report parameters
    controller.$inject = [
        '$state', '$scope', '$window', 'report', 'reportFactory',
        'reportParamsOptions', 'reportUrlFactory', 'accessTokenFactory', '$q'
    ];

    function controller($state, $scope, $window, report, reportFactory,
        reportParamsOptions, reportUrlFactory, accessTokenFactory, $q) {
        // MW-1178: Ends here
        var vm = this;

        vm.$onInit = onInit;

        // Malawi: supported formats
        vm.supportsFormat = supportsFormat;
        // --- ends here ---

        vm.downloadReport = downloadReport;

        vm.paramsInfo = {
            GeographicZone: 'report.geographicZoneInfo',
            DueDays: 'report.dueDaysInfo'
        };

        // MW-1178: Add datepicker & multiple select to report parameters
        vm.booleanOptions = [{
            name: 'Yes',
            value: 'true'
        },
        {
            name: 'No',
            value: 'false'
        }]
        // MW-1178: Ends here

        /**
         * @ngdoc property
         * @propertyOf report.controller:ReportGenerateController
         * @name report
         * @type {Object}
         *
         * @description
         * The object representing the selected report.
         */
        vm.report = report;

        /**
         * @ngdoc property
         * @propertyOf report.controller:ReportGenerateController
         * @name paramsOptions
         * @type {Array}
         *
         * @description
         * The param options for this report, by param. A param can have multiple options, for
         * example a period param, will have all available periods as options. Objects containing
         * 'value' and 'displayName' properties.
         */
        vm.paramsOptions = reportParamsOptions;

        /**
         * @ngdoc property
         * @propertyOf report.controller:ReportGenerateController
         * @name selectedParamsOptions
         * @type {Object}
         *
         * @description
         * The collection of selected options by param name.
         */
        vm.selectedParamsOptions = {};

        /**
         * @ngdoc property
         * @propertyOf report.controller:ReportGenerateController
         * @name selectedParamsDependencies
         * @type {Object}
         *
         * @description
         * The collection of parameter dependencies and their selected values.
         */
        vm.selectedParamsDependencies = {};

        /**
         * @ngdoc property
         * @propertyOf report.controller:ReportGenerateController
         * @name format
         * @type {String}
         *
         * @description
         * The format selected for the report. Either 'pdf' (default), 'csv', 'xls' or 'html'.
         */
        vm.format = 'pdf';

        /**
         * @ngdoc method
         * @methodOf report.controller:ReportGenerateController
         * @name downloadReport
         *
         * @description
         * Downloads the report. Opens a new tab that redirects to the actual download report
         * url, passing selected param options as well as the selected format.
         */
        function downloadReport() {
            // MW-1178: Add datepicker & multiple select to report parameters
            const mappedParameters = vm.mapParameters(vm.selectedParamsOptions);
            // MW-1178: Ends here
            $window.open(
                accessTokenFactory.addAccessToken(
                    reportUrlFactory.buildUrl(
                        vm.report.$module,
                        vm.report,
                        mappedParameters,
                        vm.format
                    )
                ),
                '_blank'
            );
        }

        /**
         * @ngdoc method
         * @methodOf report.controller:ReportGenerateController
         * @name watchDependency
         *
         * @description
         * Sets up a watch on report parameter selection,
         * to update dependent parameters options based on it's value.
         *
         * @param   {Object}    param             the report parameter that needs to watch for
         *                                        dependency.
         * @param   {Object}    dep               the dependency object to set up watch for.
         */
        function watchDependency(param, dep) {
            var watchProperty = 'vm.selectedParamsOptions.' + dep.dependency;
            $scope.$watch(watchProperty, function(newVal) {
                vm.selectedParamsDependencies[dep.dependency] = newVal;
                if (newVal) {
                    reportFactory.getReportParamOptions(param, vm.selectedParamsDependencies)
                        .then(function(items) {
                            vm.paramsOptions[param.name] = items;
                        });
                }
            });
        }

        // MALAWISUP-5452: Limit 'All districts' option in certain reports
        /**
         * @ngdoc method
         * @methodOf report.controller:ReportGenerateController
         * @name $watchForAllDistricts
         *
         * @description
         * Checks whether report has restricted 'All districts' option for generating in PDF format.
         */
        function watchForAllDistricts() {
            const restrictedReports = ["Distribution List", "LMIS Summary by facility"]
            $scope.$watch('vm.format', function (newVal) {
                if (newVal && restrictedReports.includes(vm.report.name)) {
                    vm.report.templateParameters = vm.report.templateParameters.map((templateParameter) => {
                        if (templateParameter.name === 'district') {
                            templateParameter.required = newVal === 'pdf';
                        }
                        return templateParameter;
                    });
                }
            })
        }
        // MALAWISUP-5452: Ends here

        /**
         * @ngdoc method
         * @methodOf report.controller:ReportGenerateController
         * @name $onInit
         *
         * @description
         * Initialization method of the ReportGenerateController.
         */
        function onInit() {
            angular.forEach(report.templateParameters, function(param) {
                angular.forEach(param.dependencies, function(dependency) {
                    watchDependency(param, dependency);
                });
            });

            // MALAWISUP-5452: Limit 'All districts' option in certain reports
            watchForAllDistricts();
            // MALAWISUP-5452: Ends here

            // Malawi: supported formats
            var supportedFormats = ['pdf', 'csv', 'xls', 'xlsx', 'html'];
            var defaultFormats = ['pdf', 'csv', 'xls', 'html'];

            vm.formats = [];

            angular.forEach(report.supportedFormats, function(format) {
                if (supportedFormats.indexOf(format) !== -1) {
                    vm.formats.push(format);
                }
            });
            if (vm.formats.length === 0) {
                vm.formats = defaultFormats;
            }
            vm.format = vm.formats[0];
            // --- ends here ---

            // MW-1178: Add datepicker & multiple select to report parameters
            vm.filterAvailableParameters = filterAvailableParameters;
            vm.mapParameters = mapParameters;
            // MW-1178: Ends here
        }

        // Malawi: supported formats
        function supportsFormat(format) {
            return vm.formats.indexOf(format) !== -1;
        }
        // --- ends here ---

        // MW-1178: Add datepicker & multiple select to report parameters
        function changeCommasToSemicolons(text) {
            // MALAWISUP-4789: Fix error related to reports not pulling data
            if (text === null) {
                return text;
            }
            // MALAWISUP-4789: Ends here
            const reducedText = text.reduce((acc, curr) => {
                return acc + curr.replace(',', ';;') + ";"
            }, "");
            return reducedText.slice(0, reducedText.length - 1);
        }

        /**
         * @ngdoc method
         * @methodOf report.controller:ReportGenerateController
         * @name mapParameters
         *
         * @description
         * Method changig the types of parameters in order to create an report (which requires concrete types)
         * @param  {Array} parameter the parameter used when filtering tags
         * @return {String} string 
         */
        function mapParameters(parameters) {
            const mappedParameters = Object.assign({}, parameters);
            for (const property in mappedParameters) {
                if ((typeof mappedParameters[property]) == (typeof [])) {
                    mappedParameters[property] = changeCommasToSemicolons(mappedParameters[property]);
                }
            };
            return mappedParameters;
        }

        /**
         * @ngdoc method
         * @methodOf report.controller:ReportGenerateController
         * @name filterAvailableParameters
         *
         * @description
         * Filters the list of available parameters with the given query. Returns a promise resolving to the filtered list.
         * The reason why this method returns a promise is that it is required by the ngTagsInput.
         *
         * @param  {String} parameter the parameter used when filtering tags
         * @param  {String} query the query used when filtering tags
         * @return {Promise}      the promise resolving to filtered list
         */
        function filterAvailableParameters(parameter, query) {
            if (!vm.paramsOptions[parameter.name]) {
                return $q.resolve([]);
            }

            if (!query) {
                return $q.resolve(vm.paramsOptions[parameter.name]);
            }

            return $q.resolve([...new Set(vm.paramsOptions[parameter.name].filter(function(parameter) {
                return parameter.name.toLowerCase()
                    .indexOf(query.toLowerCase()) > -1;
            }).map(function(parameter) {
                return parameter.name;
            }))]);
        }
        // MW-1178: Ends here
    }
})();

