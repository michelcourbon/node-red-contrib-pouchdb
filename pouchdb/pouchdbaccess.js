"use strict"; 
module.exports = function(RED) {

// json parse to verify before send to nosql database
function isJson(str) {
	var myJSON = JSON.stringify(str);
	try {
		JSON.parse(myJSON);
	} catch (e) {
		return false;
	}
	return true;
}

function isDataBaseUrl (url) {
	var output = url;
	output = output.replace(/\s+/g,'');
	var lastChar = output[output.length-1];
	if (lastChar!='/') output = output + '/';
	return output;
}

// node
    function PouchdbAccessNode(config) {
	
        RED.nodes.createNode(this,config);
        var node = this;

	this.server = isDataBaseUrl(config.server);
	this.database = config.database;

        // knows this is a database
        var PouchDB = require('pouchdb');
	var url = this.server + this.database;
	var db = new PouchDB(url);
	db.info().then(
		function (info) {
			node.status({fill:"green",shape:"dot",text:"connected"});
		},
		function(info){
			node.status({fill:"red",shape:"ring",text:"disconnected"});
		}
	);

	// events as input msg
        this.on('input', function(msg) {
	  var mesg={payload:""};
	  if (msg.topic!="database"){ // standard post method..
		if (isJson(msg.payload)) {
			db.post(msg.payload,function(err, body) {
			  	if (err) {
					node.status({fill:"red",shape:"ring",text:"disconnected"});
					mesg.payload = err;
				} else {
					node.status({fill:"green",shape:"dot",text:"connected"});
					mesg.payload = body;
				}
			node.send(mesg);			    
			});
		} else {
			mesg.payload = "error : parsing JSon string";
			node.send(mesg);
		};
	  } else { // database creation
		var url = this.server + msg.payload;
		db = new PouchDB(url);
		db.info().then(
			function (info) {
				node.status({fill:"green",shape:"dot",text:"connected"});
				mesg.payload = info;
				node.send(mesg);
			},
			function(info){
				node.status({fill:"red",shape:"ring",text:"disconnected"});
				mesg.payload = "error server out, unable to create database "+msg.payload;
				node.send(mesg);
			}
		);
	  } // end of db creation
        }); // end of input evt..
    }

    // Register the node by name.
    RED.nodes.registerType("pouchdbaccess",PouchdbAccessNode);
}
