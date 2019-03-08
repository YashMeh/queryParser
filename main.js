var express = require('express');
var app = express();
var server = require('http').createServer(app);
var mongoose=require("mongoose");
var port=process.env.PORT || 3000;
var io = require('socket.io')(server);
var query=io.of('/query');
var device=require("./models/device")
//var global=[];
mongoose.connect("mongodb://localhost/senzJS",{useNewUrlParser:true}).then((e)=>{
    console.log("MongoDB Connected");
}).catch((err)=>{
    console.log(err);
})
var alreadyPresent=(name)=>{
    return new Promise((resolve,reject)=>{
        device.find({name:name}).then((result)=>{
            if(result.length!=0)
            {
                resolve(true);
            }
            else
            {
                resolve(false);
            }
        })
    })
}
var active=(name)=>{
    device.find({name:name}).then((result)=>{
        if(result[0].sessionID.length==0)
        {
            return false;
        }
        return true;
    }).catch((err)=>{
        console.log(err);
    })
}
var handleConnection=(socket)=>{
    socket.emit("handshake",{message:"Client Connected",id:socket.id});
    console.log("Connection request accepted from socket :"+socket.id);
    socket.on("register",function(data){
        var senQuery=data.split(" ");
        if(senQuery[0]=='SHARE')
        {
            senQuery[6]=senQuery[6].substr(1,)
            alreadyPresent(senQuery[6]).then((present)=>{
                if(present)
            {
                io.to(socket.id).emit("registered","Device name not available.");
                //Disconnect the client
            }
            else
            {
                var obj={name:senQuery[6],publicKey:senQuery[2]};
                device.create(obj).then((createdDevice)=>{
                    io.to(socket.id).emit("registered","Device registered.");
                    console.log(createdDevice);
                }).catch((err)=>{
                    console.log(err);
                })
            }

            })
            
            

        }
        
            
        
    })
}
var handleQuery=(socket)=>{
    socket.emit("Connected to the query namespace");
    //This will print /query#socket.id
    console.log("Connected to the query with socket :"+socket.id.substr(7,)); 
    socket.on("query",function(data){
        
        var senQuery=data.split(" ");
        if(senQuery[0]=='DATA')
        {
            
        }
    })
}
io.on("connection",handleConnection);
query.on("connection",handleQuery);
server.listen(port,function(err){
    if(err)
    {
        console.log(err);
    }
    console.log("App running at port "+port);
    
});