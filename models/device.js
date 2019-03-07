var mongoose=require("mongoose");

var deviceSchema=new mongoose.Schema({
    name:{
        type:String
    },
    sessionID:{
        type:String
    }
    
})	
module.exports=mongoose.model("device",deviceSchema);
