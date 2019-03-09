const dotenv=require("dotenv");
dotenv.config();
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var mongoose=require("mongoose");
var port=process.env.PORT || 3000;
var io = require('socket.io')(server);

//Defining namespaces
var registration=io.of('/register');
var query=io.of('/query');
var client=io.of('/client');
var device=require("./models/device");

//Connecting to mongoose
var uri="mongodb://localhost/senzJS";
mongoose.connect(uri,{useNewUrlParser:true}).then((e)=>{
    console.log("MongoDB Connected");
}).catch((err)=>{
    console.log(err);
})
//databaseMethods
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
    var obj={registered:false,active:false};
    return new Promise((resolve,reject)=>{
        device.find({name:name}).then((result)=>{
            if(result.length==0)
            {
                resolve(obj);
            }
            else if(result[0].sessionID=="")
            {
                obj.registered=true;
                resolve(obj);
            }
            else
            {
                obj.registered=true;
                obj.active=true;
                resolve(obj);
            }
        })
    })
}
var assignID=(name,sessionID)=>{
    return new Promise((resolve,reject)=>{
        device.findOneAndUpdate({name:name},{$set:{sessionID:sessionID}}, {new: true}).then((foundDevice)=>{
            resolve(foundDevice);
        })
    })
}
var sendData=(message,targetDevice)=>{
    return new Promise((resolve,reject)=>{
        device.find({name:targetDevice}).then((receiver)=>{
            console.log(".........................")
            console.log(receiver)
            io.of("/client").to(receiver[0].sessionID).emit("received",{data:message});
            resolve("Sent");
        })
    })
}
//Socket Methods
var handleRegistration=(socket)=>{
    
    console.log("Connection request accepted from socket :"+socket.id.substr(10,));
    socket.on("register",function(data){
        var senQuery=data.split(" ");
        if(senQuery[0]=='SHARE')
        {
            senQuery[6]=senQuery[6].substr(1,)
            alreadyPresent(senQuery[6]).then((present)=>{
                
                if(present)
            {
                
                io.of('/register').to(socket.id).emit("registered",{registered:false});
                //Disconnect the client
            }
            else
            {
                var obj={name:senQuery[6],publicKey:senQuery[2]};
                device.create(obj).then((createdDevice)=>{
                    io.of('/register').to(socket.id).emit("registered",{registered:true});
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
    console.log("Connected to the query with socket :"+socket.id.substr(7,)); 
    socket.on("query",function(data){
        
        var senQuery=data.split(" ");
        if(senQuery[0]=='DATA')
        {
            var targetDevice=senQuery[3].substr(1,)
            active(targetDevice).then((result)=>{
                if(result.registered==false)
                {
                    io.of('/query').to(socket.id).emit("sending","Target Device not registered");
                }
                else if(result.registered==true && result.active==false)
                {
                    io.of('/query').to(socket.id).emit("sending","Target Device not active");
                }
                else
                {
                    var message=senQuery[2];
                    sendData(message,targetDevice).then((success)=>{
                        io.of('/query').to(socket.id).emit('sending','Data sent');
                    })
                }
            })
            
        }
    })
}
var handleConnection=(socket)=>{
    socket.on("giveID",function(name){
        assignID(name,socket.id).then((assignedObj)=>{
            io.of("/client").to(socket.id).emit("connected",{assigned:true});
            console.log(assignedObj);
        })

    })
}
//Calling namespaces
client.on("connection",handleConnection)
registration.on("connection",handleRegistration);
query.on("connection",handleQuery);

//express app setup
app.use(express.static(__dirname+'/views'));

//home route
app.get("/",(req,res)=>{
    res.sendFile("app.html",{root:__dirname+"/views"})
})
//Starting server
server.listen(port,function(err){
    if(err)
    {
        console.log(err);
    }
    console.log("App running at port "+port);
    
});