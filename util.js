var fs = require("fs");
Array.prototype.where = function(key,value){
	var temp = new Array();
	for(var i =0;i<this.length;i++){
		this[i][key] == value ? temp.push(this[i]) : "";
	}
	return temp;
}
Array.prototype.queryIndexByNameAndKey =  function(name,key){
	for(var i in this){
		if(this[i][key] == name){
			return i;
		}  
	}

	return -1;
}
Array.prototype.each = function (callback){
    for(var i=0;i<this.length;i++){
        callback(i,this[i],this.length);
    }
}



exports = module.exports = {
	writeJSONtoTxt : function(file,json){
					 	fs.stat(file, function(err,stats){
							if(stats == undefined){
								 fs.open(file,"w",function(){
								 	fs.appendFileSync(file,JSON.stringify(json)+"\n");
								 });
								 
							}else{
								
								fs.appendFileSync(file,JSON.stringify(json)+"\n");
								
							}
						})
	},
	readTxT : function(file,callback){
						callback = callback || function(callback){console.log("callback error")}

						fs.stat(file, function(err,stats){
							if(stats == undefined){
								 fs.open(file,"w",function(){
								 	callback(fetchData(file));
								 });
							}else{
								callback(fetchData(file));
								
							}
						})

						function fetchData(){
							var chatCache = new Array();
							var data = fs.readFileSync(file,"utf-8");
							data.toString().split('\n').each(function(i,self,length){
									if(i<length-1) chatCache.push(JSON.parse(self));
								});
							return chatCache;
						}		
	}
}


