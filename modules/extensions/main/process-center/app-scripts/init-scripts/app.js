var caramel = require('caramel');

var carbon = require('carbon');
var process = require('process');
var conf = carbon.server.loadConfig('carbon.xml');
var offset = conf.*::['Ports'].*::['Offset'].text();
var hostName = conf.*::['HostName'].text().toString();

var configurationContextService = carbon.server.osgiService('org.wso2.carbon.utils.ConfigurationContextService');
var carbonUtils = Packages.org.wso2.carbon.utils.CarbonUtils;
var configCtx = configurationContextService.getServerConfigContext();

var httpPort = carbonUtils.getTransportPort(configCtx,"http");
var httpsPort = carbonUtils.getTransportPort(configCtx,"https");

if (hostName === null || hostName === '') {
    hostName = process.getProperty('carbon.local.ip');
}

process.setProperty('server.host', hostName);
process.setProperty('http.port', httpPort.toString());
process.setProperty('https.port', httpsPort.toString());


/*
  Rxt stuff
 */

//var rxt_management=require('/modules/rxt/rxt.manager.js').rxt_management();
//var publisherConfig=require('/config/publisher.json');
//var pubConfig=require('/config/publisher.js').config();

/*
Finished the parsing stuff
 */
caramel.configs({
    context: '/process-center',
    //analyticsContext: '/bpmn-analytics-explorer',
    cache: true,
    negotiation: true,
    themer: function () {
        /*var meta = caramel.meta();
        if(meta.request.getRequestURI().indexOf('gadget') != -1) {
            return 'modern';
        }*/
        return 'process-center';
    }/*,
    languagesDir: '/i18n',
    language: function() {
        return 'si';
    }*/
});

var configs = require('/config/process-center.js').config();

var log=new Log();
if(log.isDebugEnabled()){
    log.debug('#### process center CONFIG LOGIC ####');
}

var mod = require('store');
mod.server.init(configs);

mod.user.init(configs);
var rxt=require('rxt');
var lifecycle=require('lifecycle');
rxt.core.init();
rxt.resources.init();
var context=caramel.configs().context;
rxt.app.init(context);
lifecycle.core.init();

var store = require('/modules/store.js');
store.init(configs);
rxt.server.init(configs);

rxt.permissions.init();
//log.info("process center URL : " + configs.server.http + caramel.configs().context);
/*
var url='https://<HOST>:<PORT>/admin',
    username='admin',
    password='admin';

var server=new carbon.server.Server(url);
var registry=new carbon.registry.Registry(server,{
    systen:true,
    username:username,
    tenantId:carbon.server.superTenant.tenantId
});
 */

//TODO : fix this
var tenantId = -1234;
var event = require('event');
event.emit('tenantLoad', tenantId);

if(log.isDebugEnabled()){
    log.debug('#### FINISHED process center CONFIG LOGIC #####');
}

//for server startup log for informing store URL
var  processCenterUrl = function() {
	var log = new Log();
	log.info("Process Center URL : " + configs.server.http + caramel.configs().context);
    //log.info("Analytics Explorer URL : " + configs.server.http + caramel.configs().analyticsContext);
};

setTimeout(processCenterUrl, 7000);



