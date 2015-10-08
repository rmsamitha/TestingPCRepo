/*
*  Copyright (c) 2014, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
*
*  WSO2 Inc. licenses this file to you under the Apache License,
*  Version 2.0 (the "License"); you may not use this file except
*  in compliance with the License.
*  You may obtain a copy of the License at
*
*  http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing,
*  software distributed under the License is distributed on an
*  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
*  KIND, either express or implied.  See the License for the
*  specific language governing permissions and limitations
*  under the License.
*
*/

var assetLinks = function(user) {
    return {
        title: 'Process'
    };
};

asset.manager = function(ctx) {
     var notifier = require('store').notificationManager;
     var storeConstants = require('store').storeConstants;
    var COMMENT = 'User comment';
    var carbon = require('carbon');
    var social = carbon.server.osgiService('org.wso2.carbon.social.core.service.SocialActivityService');
 return {
     create: function(options) {
         var ref = require('utils').time;
         var GovernanceConstants = Packages.org.wso2.carbon.governance.api.util;
         //Check if the options object has a createdtime attribute and populate it
         if ((options.attributes) && (options.attributes.hasOwnProperty('overview_createdtime'))) {
             options.attributes.overview_createdtime = ref.getCurrentTime();
         }
         this._super.create.call(this, options);
         var asset = this.get(options.id);

          //Adding associations for properties_predecessors
         if (asset.attributes.properties_predecessors != null) {
             var listOfPredecessors = asset.attributes.properties_predecessors.split("\,");

             for (var i = 0; i < listOfPredecessors.length; i++) {

                 var preAsset = this.get(listOfPredecessors[i]);
                 this.registry.associate(asset.path, preAsset.path, "Predecessors");
             }
         }
         //Adding associations for properties_specializations
         if (asset.attributes.properties_specializations != null) {
             var listOfSpecializations = asset.attributes.properties_specializations.split("\,");
             for (var i = 0; i < listOfSpecializations.length; i++) {
                 var specAsset = this.get(listOfSpecializations[i]);
                 this.registry.associate(asset.path, specAsset.path, "Specializations");
             }
         }
         //Adding associations for properties_generalizations
         if (asset.attributes.properties_generalizations != null) {
             var listOfGeneralizations = asset.attributes.properties_generalizations.split("\,");
             for (var i = 0; i < listOfGeneralizations.length; i++) {
                 var genAsset = this.get(listOfGeneralizations[i]);
                 this.registry.associate(asset.path, genAsset.path, "Generalizations");
             }
         }
         //Adding associations for properties_successors
         if (asset.attributes.properties_successors != null) {
             var listOfSuccessors = asset.attributes.properties_successors.split("\,");
             for (var i = 0; i < listOfSuccessors.length; i++) {
                 var sucAsset = this.get(listOfSuccessors[i]);
                 this.registry.associate(asset.path, sucAsset.path, "Successors");
             }
         }
         var assetPath = asset.path;
            var user = ctx.username;
            var userRoles = ctx.userManager.getRoleListOfUser(user);
            try {
                social.warmUpRatingCache(ctx.assetType + ':' + options.id);
            } catch (e) {
                log.warn("Unable to publish the asset: " + ctx.assetType + ":" + options.id + " to social cache. This may affect on sort by popularity function.");
            }
            //Check whether the user has admin role
            var endpoint = storeConstants.PRIVATE_ROLE_ENDPOINT + user;
            for (var role in userRoles) {
                if (userRoles.hasOwnProperty(role) && userRoles[role] == storeConstants.ADMIN_ROLE) {
                    endpoint = storeConstants.ADMIN_ROLE_ENDPOINT;
                }
            }

            var provider = ctx.username;

            if(options.attributes.overview_provider){
                provider = options.attributes.overview_provider;
            }
            provider = provider.replace(':', '@');
            //Subscribe the asset author for LC update event and asset update event
            notifier.subscribeToEvent(provider, assetPath, endpoint, storeConstants.LC_STATE_CHANGE);
            notifier.subscribeToEvent(provider, assetPath, endpoint, storeConstants.ASSET_UPDATE);
     },
     update: function(options) {
            this._super.update.call(this, options);
            var asset = this.get(options.id); //TODO avoid get: expensive operation

            if (asset.attributes.properties_predecessors != null) {
             var listOfPredecessors = asset.attributes.properties_predecessors.split("\,");
             for (var i = 0; i < listOfPredecessors.length; i++) {
                 var preAsset = this.get(listOfPredecessors[i]);
                 this.registry.associate(asset.path, preAsset.path, "Predecessors");
             }
         }
         if (asset.attributes.properties_successors != null) {
             var listOfSuccessors = asset.attributes.properties_successors.split("\,");
             for (var i = 0; i < listOfSuccessors.length; i++) {
                 var sucAsset = this.get(listOfSuccessors[i]);
                 this.registry.associate(asset.path, sucAsset.path, "Successors");
             }
         }
          //Adding associations for properties_generalizations
         if (asset.attributes.properties_generalizations != null) {
             var listOfGeneralizations = asset.attributes.properties_generalizations.split("\,");
             for (var i = 0; i < listOfGeneralizations.length; i++) {
                 var genAsset = this.get(listOfGeneralizations[i]);
                 this.registry.associate(asset.path, genAsset.path, "Generalizations");
             }
         }
         if (asset.attributes.properties_specializations != null) {
             var listOfSpecializations = asset.attributes.properties_specializations.split("\,");
             for (var i = 0; i < listOfSpecializations.length; i++) {
                 var specAsset = this.get(listOfSpecializations[i]);
                 this.registry.associate(asset.path, specAsset.path, "Specializations");
             }
         }
            //trigger notification on asset update
            notifier.notifyEvent(storeConstants.ASSET_UPDATE_EVENT, asset.type, asset.name, null, asset.path, ctx.tenantId);
        }
 };
};

asset.server = function(ctx) {
    var type = ctx.type;
    return {
        onUserLoggedIn: function() {},
        endpoints: {
            apis: [{
                url: 'assets',
                path: 'assets.jag'
            }, {
                url: 'content',
                path: 'content.jag'
            },{
                url: 'processes',
                path: 'processes.jag'
            }],
            pages: [{
                title: 'Asset: ' + type,
                url: 'asset',
                path: 'asset.jag'
            }, {}, {
                title: 'Create ' + type,
                url: 'create',
                path: 'create.jag'
            }, {
                title: 'Update ' + type,
                url: 'update',
                path: 'update.jag'
            }, {
                title: 'Details ' + type,
                url: 'details',
                path: 'details.jag'
            }, {
                title: 'List ' + type,
                url: 'list',
                path: 'list.jag'
            }, {
                title: 'Lifecycle',
                url: 'lifecycle',
                path: 'lifecycle.jag'
            }]
        }
    };
};
