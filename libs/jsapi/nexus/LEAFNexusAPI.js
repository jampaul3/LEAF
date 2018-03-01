/*
 * API for LEAF Nexux
 */
var LEAFNexusAPI = function () {
    var baseURL = './api/?a=',
        Groups = NexusGroupsAPI(this.baseURL),

        /**
         * Get the base URL for the LEAF Nexus API (e.g. "/LEAF_Nexus/api/?a=")
         */
        getBaseURL = function () {
            return baseURL;
        },

        /**
         * Set the base URL for the LEAF Nexus API (e.g. "/LEAF_Nexus/api/?a=")
         */
        setBaseURL = function (baseAPIURL) {
            baseURL = baseAPIURL;
        };

    return {
        getBaseURL: getBaseURL,
        setBaseURL: setBaseURL,
        Groups: Groups
    };
};

/**
 * API for working the Nexus Groups
 * 
 * @param baseAPIURL    string  the base URL for the LEAF Nexus API (e.g. "/LEAF_Nexus/api/?a=") 
 */
var NexusGroupsAPI = function (baseAPIURl) {
    var apiBaseURL = baseAPIURL,
        apiURL = apiBaseURL + 'group',

        /**
         * Get the URL for the LEAF Nexus Groups API
         */
        getAPIURL = function () {
            return apiURL;
        },

        /**
         * Get the base URL for the LEAF Nexus API
         */
        getBaseAPIURL = function () {
            return apiBaseURL;
        },

        /**
         * Get all employees associated with a group with their extended
         * Employee info (data and positions). 
         * 
         * @param groupID      int                 The groupID to search
         * @param limit        int                 the number of users to return
         * @param offset       int                 the number of users to offset in the query
         * @param onSuccess    function(employees)   the callback containing all fetched users 
         * @param onFail       function(error)     callback when query fails
         */
        listGroupEmployeesDetailed = function (groupID, limit, offset, onSuccess, onFail) {
            var fetchURL = this.apiURL + "/" + groupID + "/employees/detailed";
            if (limit !== -1) {
                fetchURL += "&limit=" + limit;
            }

            if (offset > 0) {
                fetchURL += "&offset=" + offset;
            }

            if (searchText.length > 0) {
                fetchURL += "&search=" + searchText;
            }

            $.ajax({
                method: 'GET',
                url: fetchURL,
                dataType: 'json'
            })
                .done(function (msg) {
                    onSuccess(msg);
                })
                .fail(function (err) {
                    onFail(err);
                });
            // .always(function() {});
        };

    return {
        getAPIURL: getBaseAPIURL,
        getBaseAPIURL: getBaseAPIURL,
        listGroupEmployeesDetailed: listGroupEmployeesDetailed
    };
};