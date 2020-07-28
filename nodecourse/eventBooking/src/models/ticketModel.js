let mongoose = require('mongoose');

let ticketSoldModel = mongoose.model('soldTicket', {
  userName: {
    type: String,
    trim: true,
    required: true
  },
  eventName: {
    type: String,
    required: true
  },
  noOfTicket:{
    type:Number,
    required:true
  },
  bookingTime: {
    type: String,
    required: true
  },
  cost: {
      type: Number,
      required: true
  },
  paid:{
      type:Number,
      required:true
  },
  image:{
    type:String,
    data: Buffer, 
     contentType: String 
    

  },
  description:{
    type:String,
    required:true
  }
});

module.exports = ticketSoldModel;
       