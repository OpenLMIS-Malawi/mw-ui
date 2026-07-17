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
     * @name referencedata-user.User
     *
     * @description
     * Represents a single user.
     */
    angular
        .module('referencedata-user')
        .factory('User', User);

    function User() {

        User.prototype.toJson = toJson;
        User.prototype.getRoleAssignments = getRoleAssignments;
        User.prototype.getBasicInformation = getBasicInformation;
        User.prototype.getContactDetails = getContactDetails;
        User.prototype.getAuthDetails = getAuthDetails;
        User.prototype.removeHomeFacilityRights = removeHomeFacilityRights;
        User.prototype.save = save;

        return User;

        /**
         * @ngdoc method
         * @methodOf referencedata-user.User
         * @name User
         *
         * @description
         * Creates a new instance of the User class.
         *
         * @param  {Object}                  json the json representation of the user
         * @return {Object}                  the user object
         */
        function User(json, repository) {
            if (json) {
                this.id = json.id;
                this.username = json.username;
                this.firstName = json.firstName;
                this.lastName = json.lastName;
                this.jobTitle = json.jobTitle;
                this.phoneNumber = json.phoneNumber;
                this.email = json.email;
                this.timezone = json.timezone;
                this.homeFacilityId = json.homeFacilityId;
                this.verified = json.verified;
                this.active = json.active;
                this.allowNotify = json.allowNotify;
                this.extraData = json.extraData;
                this.enabled = json.enabled;
                this.roleAssignments = json.roleAssignments;
                // MW-1477: last unsuccessful login attempt date (shown on the Lockouts tab)
                this.lastUnsuccessfulAuthenticationAttemptDate =
                    json.lastUnsuccessfulAuthenticationAttemptDate;
            }

            this.repository = repository;
            this.isNewUser = !this.id;
        }

        /**
         * @ngdoc method
         * @methodOf referencedata-user.User
         * @name toJson
         *
         * @description
         * Serializes the given user into a JSON string.
         *
         * @return {String} the user as JSON string
         */
        function toJson() {
            return angular.toJson(this);
        }

        /**
         * @ngdoc method
         * @methodOf admin-user-roles.User
         * @name getRoleAssignments
         *
         * @description
         * Gets role assignments by type.
         *
         * @param {String} type                 the role assignment types
         * @param {String} supervisoryNodeId    the UUID of supervisory node
         * @param {String} programId            the UUID of program
         * @return {Array}                      the list of role assignments that match passed parameters.
         */
        function getRoleAssignments(type, supervisoryNodeId, programId) {
            return this.roleAssignments
                .filter(function(role) {
                    return isFieldHasValue('type', role, type)
                        && isFieldHasValue('supervisoryNodeId', role, supervisoryNodeId)
                        && isFieldHasValue('programId', role, programId);
                })
                .sort(function(a, b) {
                    return (a.roleName > b.roleName) ? 1 : ((b.roleName > a.roleName) ? -1 : 0);
                });
        }

        function isFieldHasValue(field, role, value) {
            return !value || role[field] === value;
        }

        function save() {
            this.active = this.enabled;
            if (this.id) {
                return this.repository.update(this);
            }
            return this.repository.create(this);
        }

        function getBasicInformation() {
            return {
                id: this.id,
                username: this.username,
                firstName: this.firstName,
                lastName: this.lastName,
                jobTitle: this.jobTitle,
                timezone: this.timezone,
                homeFacilityId: this.homeFacilityId,
                active: this.active,
                extraData: this.extraData,
                roleAssignments: this.roleAssignments
            };
        }

        function getContactDetails() {
            return {
                referenceDataUserId: this.id,
                phoneNumber: this.phoneNumber,
                allowNotify: this.allowNotify,
                emailDetails: {
                    emailVerified: this.verified,
                    email: this.email
                }
            };
        }

        function getAuthDetails() {
            return {
                id: this.id,
                username: this.username,
                enabled: this.enabled
            };
        }

        function removeHomeFacilityRights() {
            this.roleAssignments = this.roleAssignments.filter(function(roleAssignment) {
                return !(roleAssignment.programId && !roleAssignment.supervisoryNodeId);
            });
        }
    }
})();
