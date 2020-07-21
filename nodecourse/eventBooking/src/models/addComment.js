const mongoose = require('mongoose');

const addCommentModel = mongoose.model('comments', {
  eventName: {
    type:String
  },
  eventId:{
      type:String
  },
  userName:{
      type:String
  } ,
  comments:{
      type:String
  },
  time:{
    type:String
  } 
});
module.exports=addCommentModel;
    