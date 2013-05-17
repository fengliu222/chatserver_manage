// By moe.
// TODOs:
//	1.缓存的聊天信息全部存入硬盘
//	2.清理程序的log数目
//	3.缓存的消息数量控制
var http = require('http').createServer(),
	socketio = require('socket.io').listen(http),
    fs = require("fs"),
    util = require("./util");

var connectCount = 0,
	chatCache_filePath='chatcache.txt',
	slienceList_filePath='sliencelist.txt',
	sysTimer = -1,
	slienceTimer = -1,
	initChatOn = false;

var chatCache = new Array();
var slienceCache = new Array();

//初始化，将缓存文件中的数据存入内存。
util.readTxT(chatCache_filePath,function(chatCache_20){
	chatCache = chatCache_20;
	initChatOn = true;
});
util.readTxT(slienceList_filePath,function(s){
	slienceCache = s;
});

//禁言处理函数
handleSlience = {
 	do_slience: function(name,time){
 		var haveExist = false;
 		var req = {
 			oname:name,
 			odate:new Date().getTime(),
 			otime:time
 		}
 		slienceCache.each(function(i,self,length){
 			 if(self.oname == name){
 			 	haveExist = true;
 			 }
 		})
 		//util.writeJSONtoTxt(slienceList_filePath,req);
 		if(slienceCache && !haveExist) slienceCache.push(req);
 	},
 	cancel_slience: function(name){
 		slienceCache.each(function(i,self,length){
 			 if(self.oname == name){
 			 	slienceCache.splice(i,1);
 			 }
 		})
 	},
 	checkSlience:function(name){
 		var s = false;
 		slienceCache.each(function(i,self,length){
 			if(self.oname == name) s = true;
 		});
 		return s;
 	},
 	 	sTime : function(name){
 		var t = 0;
 		var startTime=0;
 		var sliTime=0;
 		var curTime = new Date().getTime();

 		slienceCache.each(function(i,self,length){
 			if(self.oname == name) {
 				startTime =  parseInt(self.odate);
 				sliTime = self.otime;
 			}
 		});

 	   var d = sliTime - Math.ceil((curTime-startTime)/1000);
       if(d>0) return d;
       else return 0;
 	}

}
//半分钟一次的禁言检测。
if(slienceTimer == -1){ 
	slienceTimer = setInterval(function(){
		var curTime = new Date().getTime();
		slienceCache.each(function(i,self,length){
			var sliTime = self.otime;
			var startTime = parseInt(self.odate);

			var d = Math.ceil((curTime-startTime)/1000);

 			if(d >= sliTime){
 				slienceCache.splice(i,1);
 			}
		})
	},30000);
}


http.listen(3000);
//Socket Listener
socketio.set("log",false);
socketio.on("connection",function(socket){
	connectCount++;
		// Chat Message handler.
		// msg = {channel:频道编号,name:玩家角色名,messageContent:消息正文}
		socket.on('chatMessage',function(msg){
			
	        console.log(msg.name+" 说: "+msg.messageContent);
	        // 广播和私聊 参数
	        // TODO 未编写完整的私聊体系
			var res = {
				channel:msg.channel,
				clubname:msg.name,
				dn:msg.dn,	//dn 私聊需要的参数,设置私聊的目标.
				mesContent:msg.messageContent,
				dn1:"",
				dn2:""
			}
	        // 触发发言者世界聊天频道参数
	        var res2 = {
	            channel:msg.channel,
	            clubname:msg.name,
	            dn:"",	
	            mesContent:msg.messageContent,
	            dn1:"",
	            dn2:"" ,
	            curChannel:msg.curChannel
	        }
	        console.log(handleSlience.checkSlience(msg.name));
	        if(!handleSlience.checkSlience(msg.name)){
				// Cache 50 messages.
				chatCache.length>50 ?  (chatCache.shift() ? chatCache.push(res) : "") : chatCache.push(res);
		        // Public Message
		       
				if(msg.channel == 0 ){
					socket.emit('pubMessage',res2,function(){
						console.log("ok");
					});
					socket.broadcast.emit('pubMessage',res,function(){
						console.log("ok");
					});
				}
				// Private Message
				else if(msg.channel == 7){	
					socket.emit('priMessage',res,function(){
						console.log("ok");
					});
					socket.broadcast.emit('priMessage',res,function(){
						console.log("ok");
					});
				}
			}else{
				var st = handleSlience.sTime(msg.name);
				console.log(st);
				var f = Math.floor(st/60);
				var sec = st - f * 60;
				socket.emit('pubMessage',{
					channel:msg.channel,
		            clubname:"系统消息",
		            dn:"",	
		            mesContent:"很抱歉，您已经被禁言，禁言时间还有"+f+"分钟"+sec+"秒",
		            dn1:"",
		            dn2:"" ,
		            curChannel:msg.curChannel
				},function(){
						console.log("ok");
				});
			}

		});

		//Cache data geter
		socket.on('getChatCache',function(type){
			var ind = 0;
			socket.emit("getChatCache",type==7 ? chatCache.where("channel",type) : chatCache);
		});

		//Chat server init method
		socket.on('init',function(){
			socket.emit('init',{chatChache:chatCache});
		});

		socket.on("disconnect",function(){
			connectCount--;
			delete socket; 
		});
		//Slience listener
		socket.on("do_slience",function(user){
			handleSlience.do_slience.call(socket,user.name,user.time)
		});
		socket.on("cancel_slience",function(user){
			handleSlience.cancel_slience.call(socket,user.name);
		})

		//System message
		//Require system message data from C# gameserver every 20s.
		fecthSystemMessage = function(){
			var req = require('http').get("http://s3.padh5.xdgame.cn/chat.aspx?SysMsg=1",function(res){
			//res.setEncodeing("utf-8");
			})
			req.on("response",function(res){
				var data = "";
			        res.on("data",function(chunk){
			            data+=chunk;
			        });
			        res.on("end",function(){
			        	try{
			        		var sysmsg;
		        			sysmsg=eval("("+data+")");
	        			    socket.emit("sysMessage",sysmsg[0],function(){
	        			    
	        			    });
	        			    socket.broadcast.emit("sysMessage",sysmsg[0],function(){
	        			    
	        			    });

			            }catch(e){
			            	console.log("row.91:" + e);
			            }
			        });
			})
			req.on("error",function(err){
			    	console.log("ERROR! "+err);
			    });
		}
		
		
		
		if(sysTimer == -1) sysTimer = setInterval(fecthSystemMessage,20000);
		//Slience handler
		
});

function pirintOnlineCount(){
	console.log("===================================");
	console.log("||  聊天服务器在线人数："+connectCount+" ||");
	console.log("===================================");
}


setInterval(pirintOnlineCount,10000);

var readline = require('readline');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


rl.on('SIGINT', function () {
    console.log("on sigint");
    fs.writeFileSync(chatCache_filePath," ");
	fs.writeFileSync(slienceList_filePath," ");
	
    chatCache.each(function(i,self,length){
  		util.writeJSONtoTxt(chatCache_filePath,self);
  	});
  	slienceCache.each(function(i,self,length){
  		util.writeJSONtoTxt(slienceList_filePath,self);
  	});

  	setTimeout(function(){
  		process.exit();
  	},1000);
});

process.on("uncaughtException",function(err){
	console.log("发生错误："+err);
})

