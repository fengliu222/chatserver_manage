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
	chatChache_filePath='chatcache.txt',
	slienceList_filePath='sliencelist.txt',
	sysTimer = -1,
	slienceTimer = -1;

var chatCache = new Array();

util.readTxT(chatChache_filePath,function(chatCache_20){
	chatChache = chatCache_20;
});

handleSlience = {
 	do_slience: function(name,time){
 		var req = {
 			oname:name,
 			odate:new Date().getTime(),
 			otime:time
 			
 		}
 		//util.writeJSONtoTxt(slienceList_filePath,req);
 	},
 	cancel_slience: function(name){
 		var nameStr = "\"name\":\""+name+"\"";
 		util.readTxT(slienceList_filePath,function(data){
 			console.log(data);
 			data.each(function(i,self,length){
 				// console.log(JSON.parse(self));
 				// if(self.name= nameStr){
 				// 	console.log("有")
 				// }
 			})
 		})
 	},
 	timer: function(){

 	}

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
	       
			// Cache 20 messages.
			chatCache.length>20 ?  (chatCache.shift() ? chatCache.push(res) : "") : chatCache.push(res) ;
	        //util.writeJSONtoTxt(chatChache_filePath,res);

	        // Public Message
			if(msg.channel == 0){
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


		});

		//Cache data geter
		socket.on('getChatCache',function(type){
			var ind = 0;
			socket.emit("getChatCache",type==7 ? chatChache.where("channel",type) : chatChache);
		});

		//Chat server init method
		socket.on('init',function(){
			socket.emit('init',{chatChache:chatChache});
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
		if(slienceTimer == -1){ 
			slienceTimer = setInterval(function(){
				handleSlience.timer.call(socket);
			},1000);
		}

});

function pirintOnlineCount(){
	console.log("===================================");
	console.log("||  聊天服务器在线人数："+connectCount+" ||");
	console.log("===================================");
}


setInterval(pirintOnlineCount,10000);

//监听进程
process.on('exit', function() {
   chatCache.each(function(i,self,length){
  		util.writeJSONtoTxt(chatChache_filePath,JSON.stringify(self));
  	});
});

process.on("uncaughtException",function(err){
	console.log("发生错误："+err);
})

// process.on('exit', function () {
// 	console.log("11111111111111111111111111111");

// });

// Start reading from stdin so we don't exit.
var stdin = process.openStdin();

process.on('SIGINT', function () {
  console.log('Got SIGINT.  Press Control-D to exit.');
    chatCache.each(function(i,self,length){
  		util.writeJSONtoTxt(chatChache_filePath,JSON.stringify(self));
  	});
});