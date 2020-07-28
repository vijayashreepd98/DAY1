let mongoose = require('mongoose');

let eventActivityModel = mongoose.model('eventStatuses', {
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
