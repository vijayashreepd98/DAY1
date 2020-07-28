let { MongoClient,ObjectId } = require('mongodb');

let connectionUrl = 'mongodb://127.0.0.1:27017';

let dataBaseName = 'eventBooking';
let conection = MongoClient.connect(connectionUrl, {
  useNewUrlParser: true, 
  useUnifiedTopology: true
},(error, client) => {
    if (error) {
      return console.log('unable to connect to database');
    }
  const db=client.db(dataBaseName);
  console.log('connected!!!');
  }
);
module.exports = conection; 