Array.prototype.each = function (callback){
		    for(var i=0;i<this.length;i++){
		        callback(i,this[i]);
		    }
		}
