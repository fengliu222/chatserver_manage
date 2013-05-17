$(function(){

	var pri = false
		, targetPlayer = ""
		, _name=""
		,socket = undefined;

	//初始化
	function init(){
		if(!window.localStorage.kfName) {
			_name = prompt("请输入您的昵称");
			_name = (_name==null||_name=="") ? "客服" : _name;
			window.localStorage.kfName = _name;
		}else{
			_name = window.localStorage.kfName;
		}
		getServerList(function(src){
			$("#loadingBar").show();
			$("#serverlist").find("li").eq(0).toggleClass("active");

			addChatserverJs(src.split("/")[0]+"//"+src.split("/")[2]+":3000/socket.io/socket.io.js");
			eventListenerCollection();	//dom事件监听集合
		});
	};
	init();


	function addChatserverJs(src){
		 if(socket) socket.disconnect();
		 $("#chatSrc").remove();

         var bd= document.getElementsByTagName('body')[0];
         var script= document.createElement('script');
         script.type= 'text/javascript';
         script.src = src;
         script.id = "chatSrc";
         script.onload = script.onreadystatechange =function(){
         	  loadingBarController(20);
	          bindChatServerAndSocketListener(src.split("/")[0]+"//"+src.split("/")[2]);	//socket链接建立以及绑定
         }
         bd.appendChild(script);
	}

	function getServerList(callback){
		$.getJSON("http://s1.p8jzog.xdgame.cn/iframePage/Loginiframe.aspx?GetServerList_2=1&&callback=?",function(r){
			var list = r.List.split("|");
			list.each(function(i,self,length){
				if(i>0) {
					var name = self.split("#")[0];
					var url = self.split("#")[1];
					$("#serverlist ul").append("<li><a href='#' data-src='"+url+"'>"+name+"</a></li>");
				}
			})

			callback(list[1].split("#")[1]);
		});
	}
	function bindChatServerAndSocketListener(src){
		loadingBarController(40);
		socket = io.connect(src); 
		socket.emit("init",{});
		socket.on("init",function(data){
			  loadingBarController(60);
		      $("#chatContent").find("ul").eq(0).html(" "); 
		          data.chatChache.each(function(i,data){
		                                 if(data.channel != 6) {
		                                 	if(data.channel == 7) formatPri(data);
		                                 	else{
		                                     	$("#chatContent").find("ul").eq(0).append("<li><a  href='#'>"+data.clubname+"</a> 说： "+data.mesContent+"</li>");
		                                 	}
		                                 } 
		                               });
		      loadingBarController(100);
		      setTimeout(function(){
		      	$("#loadingBar").fadeOut();
		      },600);
		      $("#chatContent").scrollTop(9999);

		});
		socket.on('pubMessage',function(data){   

					$("#chatContent").find("ul").eq(0).append("<li><a class=''  href='#'>"+data.clubname+"</a> 说： "+data.mesContent+"</li>");
					$("#chatContent").scrollTop(9999);
		      });
		socket.on('priMessage',function(data){
				formatPri(data);
				$("#chatContent").scrollTop(9999);
		});

	}

	function eventListenerCollection(){
		 //聊天事件
		$("#input").bind("keypress",function(e){
			if(e.keyCode != 13) return;
			if(pri)  sendChat("pri") 
			else sendChat("pub");
		});

		//切换到私聊频道
		$("#chatlist li").live("click",function(){ 
				$("#input").focus();	 		
				$("#who").html($(this).find("a").html());
				targetPlayer = $(this).find("a").html();
				$('#pri_pannel').css("display","inline");
				togglePri();
		})
		//切换回世界频道
		$('#toWorld').click(function(){
			targetPlayer = ""
			$("#input").focus();
			$("#pri_pannel").hide();
			$("#who").html("世界");
			togglePri();
		})

		//更改昵称
		$("#changeName").click(function(){
			_name = prompt("请输入您的昵称");
		_name = (_name==null||_name=="")  ? window.localStorage.kfName : _name;
		window.localStorage.kfName = _name;
		})

		//禁言
		$(".before_slience").each(function(){
			$(this).on("click",function(){
				var name = $("#who").html();
				if($(this).attr("id") != "silence_no"){
					var func = $(this).attr("id");
					var time = parseInt($(this).attr("data-sec"));
					var timeText = $(this).html();
					showConfirm(func,name,time,timeText);
				}else{
					console.log("解禁");
					cancelSlience(name);
				}	
			})
		})

		//关闭通知条
		$(".close,.sclose").bind("click",function(){
			$("#slience_confirm").hide();
		})

		//选择服务器
		$("#serverlist").find("li").each(function(){
			$(this).on("click",function(){

				if($(this).attr("class") != "active"){

					var src = $(this).find("a").eq(0).attr("data-src");
					$("#serverlist .active").toggleClass("active");
					$(this).toggleClass("active");
					loadingBarController(0);
					$("#loadingBar").show();
					$("#chatlist").empty();
					addChatserverJs(src.split("/")[0]+"//"+src.split("/")[2]+":3000/socket.io/socket.io.js");
				}
			})
		})

	}
	
	function showConfirm(func,name,time,timeText){
		$("#slience_name").empty().html(name);
		$("#slience_time").empty().html(timeText);
		$("#slience_confirm").show();

		$("#do_slience").unbind().bind("click",function(){
			socket.emit("do_slience",{name:name,time:time});
			$("#slience_confirm").hide();
			console.log("封禁成功")
		})
	}
	function cancelSlience(name){
		socket.emit("cancel_slience",{name:name});
	}
	function sendChat(type){
		if(type == "pri"){	
			socket.emit("chatMessage",{channel:7,name: _name,messageContent:$("#input").val(),curChannel:0,dn:$.trim(targetPlayer)});
		}else if(type == "pub"){
			console.log(1);
			socket.emit("chatMessage",{channel:0,name: _name,messageContent:$("#input").val(),curChannel:0,dn:""});
		}	

		 $("#input").val(" ");
	}

	function formatPri(data){
		  if(data.dn== _name) //别人对自己说话
	 	$("#chatContent").find("ul").eq(0).append("<li>【私聊】<a class=''  href='#'>"+data.clubname+"</a> 对你说： "+data.mesContent+"</li>");
	 if(data.clubname ==  _name)//自己对别人说话
	 	$("#chatContent").find("ul").eq(0).append("<li>【私聊】你对<a class=''  href='#'>"+data.dn+"</a> 说： "+data.mesContent+"</li>");
	}

	function togglePri(){
		pri = !pri;
	}

	function loadingBarController(n){
		if(n){
			var jd = n+"%";
			$("#loadingBar .bar").width(jd);
		}
	}

})