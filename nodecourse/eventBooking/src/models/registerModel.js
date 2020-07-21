const mongoose = require('mongoose');

const customerModel = mongoose.model('customers', {
  name: {
    type:String,
    trim:true,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

module.exports = customerModel;
       