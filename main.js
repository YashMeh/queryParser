var express = require('express');
var app = express();
var server = require('http').createServer(app);
var mongoose=require("mongoose");
var port=process.env.PORT || 3000;
var io = require('socket.io')(server);
var query=io.of('/query');
var device=require("./models/device")
var global=[];
mongoose.connect("mongodb://localhost/senzJS").then((e)=>{
    console.log("MongoDB Connected");
}).catch((err)=>{
    console.log(err);
})
var handleConnection=(socket)=>{
    socket.emit("handshake",{message:"Client Connected",id:socket.id});
    console.log("Connection request accepted from socket :"+socket.id);
    socket.on("register",function(data){
        var obj={name:data.name,sessionID:socket.id};
        global.push(obj);
    })
}
var handleQuery=(socket)=>{
    socket.emit("Connected to the query namespace");
    //This will print /query#socket.id
    console.log("Connected to the query with socket :"+socket.id.substr(7,)); 
    socket.on("query",function(data){
        
        var senzQuery=data.spilt(" ");
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