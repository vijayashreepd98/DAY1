const mongoose = require('mongoose');

const eventActivityModel = mongoose.model('eventactivities', {
  eventName: {
    type:String,  
    trim:true,
    required: true
  },
  userName : {
      type:String,
      required:true
  },
   status: {
    type:Boolean,
    default:false
  }
});
module.exports =eventActivityModel ;
