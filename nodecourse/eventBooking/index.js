const express = require('express');
const validator = require('validator');
const bodyParser = require('body-parser');
const handlebars     = require('handlebars');
const JSAlert = require("js-alert");
const dateFormat = require('dateformat');
//var HandlebarsIntl = require('handlebars-intl')
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const hbs = require('hbs');
//const express = require('express');
const app = express();

app.set('view engine', 'hbs');

hbs.registerHelper('if_eq', function(a, b, opts) {
    if(a%b==0&&a!=0)
        return opts.fn(this);
    else
        return opts.inverse(this);
});


const flash = require('connect-flash');
require('./src/db/mongoose');
app.use(express.urlencoded());
app.use(express.json()); 
app.use(express.static('./uploads/'));


//LOADING
var storage = multer.diskStorage({
  destination:function(req,file,cb) {
    cb(null, 'uploads/');
    
  },


  filename:function(req,file,cb){
    cb(null,file.originalname);
  }
})

var upload = multer({
  storage:storage
})


const port = process.env.PORT || 3000;
const customerModel = require('./src/models/registerModel.js');
const eventList = require('./src/models/eventModel.js');
const commentList = require('./src/models/addComment.js');
const eventStatus = require('./src/models/likeModel.js');
const bookedTickets = require('./src/models/ticketModel.js');
const { doesNotMatch } = require('assert');



app.get('/' ,(req, res) => {
  res.sendfile( './views/home.html');
});
app.get('/adminLogin',(req, res) => {
  res.sendfile('./views/adminLogin.html');
});
app.post('/adminLogin',async(req,res,next) => {
var name = req.body.uname;
var password = req.body.password;

if( name === 'admin' && password === 'admin') {
  
 
 const events = await eventList.find( { }, {
    eventName: 1,
    description: 1,
    maxNoOfTicket: 1,
    bookingStartTime: 1,
    bookingEndTime: 1,
    cost: 1,
  image:1,
    _id: 1
  });
  if (events) {
    res.render('eventView.hbs',{
      events: events
    });
  } 
 
     
} else {
  res.send("LOGIN FAILED!!!");

}


});
app.get('/adminAddingEvent',(req,res) =>{
 res.sendfile('./views/addingEvent.html') 
});


// adding event details to database
app.post('/addingEvent',upload.single('img'),(req,res) => {
  
  const ename = req.body.ename;
  const edetails = req.body.edetails;
  const npeople = req.body.npeople;
  const bookingStartTime = req.body.stime;
  const bookingEndTime = req.body.etime;
  const cost = req.body.cost;
  const image = req.file.filename;
  const sdate = dateFormat(bookingStartTime,"d-mm-yyyy  @ h:MM:ss");
  const edate = dateFormat(bookingEndTime,"d-mm-yyyy  @ h:MM:ss");
  console.log(ename+""+edetails+""+npeople+""+bookingStartTime+""+bookingEndTime);
  

if(!image){
  res.send("Please upload a file");

}else{
    console.log(image);
  if (image === "" || ename === "" || edetails === "" ||npeople === "" ||bookingStartTime === "" || bookingEndTime === "" || cost === "") {
    return res.send('Please provide valid information ..All are mandatory');
  }
  const addEventDetails = new eventList({
    eventName: ename,
    description: edetails,
    maxNoOfTicket: npeople,
    bookingStartTime: sdate,
    bookingEndTime: edate,
    cost: cost,
    image : image,
    totalTicket:npeople
  });
  addEventDetails.save().then(() => {

   return res.jsonp([{message:"Event added successfully..."}]);
  }).catch(() => {
    return res.jsonp([{message:"Failed....try again..!"}]);
  }); 
}
});
app.get('/editEvent', (req, res) => {

  res.render('editEvent.hbs', {
    eventName: req.query.eventName,
    description: req.query.description,
    tickets: req.query.tickets,
    bookingStartTime: req.query.bookingStartTime,
    bookingEndTime: req.query.bookingEndTime,
    cost: req.query.cost
    
  });
});

app.post('/editEvent' , async (req,res) =>{
  console.log(req.body.ename);
  const editedView = await eventList.findOneAndUpdate({
    eventName: req.body.eventName
  }, {
    description: req.body.description,
    bookingStartTime: req.body.stime,
    bookingEndTime: req.body.eetime,
    cost: req.body.cost,
    maxNoOfTicket: req.body.maxNoOfTicket
  });
  if (editedView) {
    res.send('Successfully update the event details!!!!...');
  } else {
    res.send('failure while updating!!!!');
  }
});


app.get('/deleteEvent', async (req, res) => {
  const deletedEvent = await eventList.findOneAndDelete({
    eventName: req.query.eventName,

  });
  if (deletedEvent) {

   res.send('deleted suceessfully!...');
  } else {
    res.send('failed to delete!!!..');
  }

});
app.get('/userRegistration',(req, res) => {
  
  res.sendfile('./views/userRegistration.html');
});

app.post('/userRegistration', async(req, res) => {
  const name = req.body.uname;
  const password = req.body.password;
  const cpassword  = req.body.cpassword;
  if (password !==cpassword ) {
    res.send('password not matching!!!');
  }
  
  else {
    const registered = await customerModel.findOne({name:name});
    if(registered){
       res.send("USER ALREADY EXISTS!!!...");
    }
    else{
    
      const register = new customerModel({
      name: name,
      password: password
    });
    
    register.save().then(async() => {
      const today = new Date();
      const events = await eventList.find( {// Date(bookingStartTime): { $lte: today } ,
        // bookingEndTime: { $gte: date } 
      }, {
        eventName: 1,
        description: 1,
        maxNoOfTicket: 1,
        bookingStartTime: 1,
        bookingEndTime: 1,
        cost: 1,
        likes: 1,
        image: 1,
        _id: 1
        });
         if (events) {
           //res.send("hai");
          res.render('userEventView.hbs', {
            events:events,
            username:req.body.uname
           
          });
        }
    }).catch(() => {
      res.send('fail!!! new user not added...');
    });
 }
}
});

app.get('/userLogin',(req, res) => {
  
  res.sendfile('./views/userLogin.html');
});


app.post('/userLogin',async(req,res)=> {
const name = req.body.uname;
const password = req.body.password;
 const user = await customerModel.findOne( {
  name:name,
  password: password
});


if(user){
  var day =new Date();
  var today = day.getDate()+'/'+(day.getMonth()+1)+'/'+day.getFullYear()+'@ '+day.getHours()+
        ':'+day.getMinutes()+':'+day.getSeconds();  
        const soldTicket = await bookedTickets.find( {//userName: req.body.uname
          //bookingStartTime: { $lte: today } ,
          //bookingEndTime: { $gte: today } 
        }, {
          eventName: 1,
          userName: 1,
          noOfTicket :1,
          bookingTime: 1,
          cost: 1,
          paid: 1,
          image:1
          }); 
      const events = await eventList.find( { //bookingStartTime: { $lte :today},
        bookingEndTime: { $gte: today } 
      }, {
        eventName: 1,
        description: 1,
        maxNoOfTicket: 1,
        bookingStartTime: 1,
        bookingEndTime: 1,
        cost: 1,
        likes: 1,
        image:1,
        _id: 1
        });
        
        if (events) {
          return res.render('userEventView.hbs', {
            events:events,
            username:req.body.uname,
            soldTicket :soldTicket
          });
        }
      else{
          //return  res.jsonp([{message:"ticket booked successfuly!!.."}]);

        }            

     } else {
       res.send("login failed")
     }
 

})

app.get('/viewMore',async(req,res) =>{
 
  const comments = await commentList.find({ eventName: req.query.eventName,
    eventId:req.query.eventId
   });
  const  events  =  await eventStatus.find( {eventName: req.query.eventName,userName: req.query.username 
  });
  
  if (events.length===0) {
  const newUser = new eventStatus({
    eventName: req.query.eventName,
    userName: req.query.username,

    status: false,

  });
  
  newUser.save().then(( ) => {
    console.log("success");
  }).catch(()=>{
console.log("sory");
  })
  }
  

  const  allEvents  =  await eventStatus.find( {eventName: req.query.eventName,userName: req.query.username 
  });
  

  let color1, color2;
  if(!allEvents){
   return  res.send("try again");
  }
  if (allEvents[0].status === true) {
    color1 = "blue";
    color2 = "black"
  } else {
    color1 = "black";
    color2 = "blue"
  }
 
 res.render('viewMore.hbs',{
  description: req.query.description,
  bookingStartTime: req.query.bookingStartTime,
  bookingEndTime: req.query.bookingEndTime,
  cost: req.query.cost,
  maxNoOfTicket: req.query.maxNoOfTicket,
  eventName:req.query.eventName,
  username: req.query.username,
  comments:comments,
  eventId:req.query.eventId,
  likes: req.query.likes,
  // color1:color1,
  // color2:color2,
  status: allEvents[0].status,
  color1: color1,
  color2: color2,
  image:req.query.image

 });


});
app.get('/bookingToHome',async(req,res)=>{
  const comments = await commentList.find({ eventName: req.query.eventName,
    eventId:req.query.eventId
   });
  const  events  =  await eventStatus.find( {eventName: req.query.eventName,userName: req.query.username 
  });
  
  if (events.length===0) {
  const newUser = new eventStatus({
    eventName: req.query.eventName,
    userName: req.query.username,

    status: false,

  });
  newUser.save().then(( ) => {
    console.log("success");
  }).catch(()=>{
    console.log("Failed");});
  }
  const  allEvents  =  await eventStatus.find( {eventName: req.query.eventName,userName: req.query.username 
  });
  

  let color1, color2;
  if(!allEvents){
   return  res.send("try again");
  }
  if (allEvents[0].status === true) {
    color1 = "blue";
    color2 = "black"
  } else {
    color1 = "black";
    color2 = "blue"
  }
 
 res.render('viewMore.hbs',{
  description: req.query.description,
  bookingStartTime: req.query.bookingStartTime,
  bookingEndTime: req.query.bookingEndTime,
  cost: req.query.cost,
  maxNoOfTicket: req.query.maxNoOfTicket,
  eventName:req.query.eventName,
  username: req.query.username,
  comments:comments,
  eventId:req.query.eventId,
  likes: req.query.likes,
  
  status: allEvents[0].status,
  color1: color1,
  color2: color2,
  image:req.query.image

 })


})
app.post('/liked',async (req,res)=>{
  const event = await eventList.findOneAndUpdate({
    _id: req.body.id
  }, {
    likes: req.body.like
  }
  );
  
  let status;
  if(req.body.status === "blue"){
    status = true;
  } else {
    status = false;
  }
 
    const activity = await eventStatus.findOneAndUpdate({
      userName: req.body.userName, 
       
      eventName: req.body.eventName
    }, {
    status: status,
    likes: req.body.like 
    });
  
  
});
app.post('/addComment', async(req, res) => {
  console.log(req.body.userName); 
  
   const addComment = new commentList({
     eventName: req.body.eventName,
     eventId: req.body.eventId,
     userName: req.body.userName,
     comments: req.body.comments,
     time: req.body.times
   });
   addComment.save().then(()=>{
 
     res.jsonp([{time:req.body.times ,
 eventId:req.body.eventId,
 eventName:req.body.eventName,
 userName:req.body.userName,
 comments:req.body.comments
     }])
   }).catch(()=>
   {
     console.log("sorry");
   });
 
 });
 app.get('/buyTicket',(req,res) =>{
res.render('userBuyTicket.hbs',{
  description: req.query.description,
  bookingStartTime: req.query.bookingStartTime,
  bookingEndTime: req.query.bookingEndTime,
  cost: req.query.cost,
  maxNoOfTicket: req.query.maxNoOfTicket,
  eventName:req.query.eventName,
  username: req.query.username,
  comments:req.query.comments,
  eventId:req.query.eventId,
  likes: req.query.likes,
  // color1:color1,
  // color2:color2,
  status:req.query.status,
  color1: req.query.color1,
  color2: req.query.color2,
  image:req.query.image

})
 });

 app.post('/bookedTicket',async(req,res) => {

  var day =new Date();
  var today = day.getDate()+'/'+(day.getMonth()+1)+'/'+day.getFullYear()+'@ '+day.getHours()+
        ':'+day.getMinutes()+':'+day.getSeconds();
  const datetimes = req.query.bookingEndTime;
  if  (today  > datetimes) {
    return res.jsonp([{message:"event already ended"}]);
    }
  const event = await eventList.findOne( { 
    eventName: req.query.eventName
  });
 console.log(event)
  if (req.body.number > event.maxNoOfTicket) {
    return res.jsonp([{message:"You cant book more ticket..Avalable ticket is "+event.maxNoOfTicket}]);
  }
  const newNoOfTicket = event.maxNoOfTicket - req.body.number;
  const updateTicket = await eventList.findOneAndUpdate({
    eventName: req.query.eventName
  }, {
    maxNoOfTicket : newNoOfTicket
  });

  if (updateTicket) {
    console.log('updated successfully!!!');
  } else {
    console.log('failed to update the ticket count!!!');
  }
  const soldTicket = new  bookedTickets( {
    userName: req.query.username,
    eventName: req.query.eventName,
    noOfTicket: req.body.number,
    
    bookingTime: today,
    cost:req.query.cost,
    paid:req.query.cost*req.body.number,
    image:req.query.image,
    description:req.query.description
  });
  soldTicket.save().then(() => {
   return  res.jsonp([{message:"ticket booked successfuly!!.."}]);
  }).catch(() => {
    return res.jsonp([{message:'ticket booking failed!!!...'}]);
  });

 


 });
 app.get('/soldTicketList', async(req,res) => {
 
 const soldTicket = await bookedTickets.find( {userName: req.query.username
  //bookingStartTime: { $lte: today } ,
  //bookingEndTime: { $gte: today } 
}, {
  eventName: 1,
  userName: 1,
  noOfTicket :1,
  bookingTime: 1,
  cost: 1,
  paid: 1,
  image:1
  }); 
 const events = req.query.events;
   res.render('purchasedTickets.hbs',{
     soldTicket:soldTicket,
     username:req.query.username,
   
   })

});
app.get('/purchaseToHome',async(req,res) =>{
  const events = await eventList.find( { 
    //bookingEndTime: { $gte: today } 
  }, {
    eventName: 1,
    description: 1,
    maxNoOfTicket: 1,
    bookingStartTime: 1,
    bookingEndTime: 1,
    cost: 1,
    likes: 1,
    image:1,
    _id: 1
    });
   // console.log(soldTicket);
    
    if (events) {
      return res.render('userEventView.hbs', {
        events:events,
        username:req.query.username,
        
      });
    }
  else{
      //return  res.jsonp([{message:"ticket booked successfuly!!.."}]);

    }            
});




app.get('/viewMoreToHome',async(req,res) =>{
  const events = await eventList.find( { 
    //bookingEndTime: { $gte: today } 
  }, {
    eventName: 1,
    description: 1,
    maxNoOfTicket: 1,
    bookingStartTime: 1,
    bookingEndTime: 1,
    cost: 1,
    likes: 1,
    image:1,
    _id: 1
    });
 
    
    if (events) {
      return res.render('userEventView.hbs', {
        events:events,
        username:req.query.username,
        
      });
    }
  else{
      //return  res.jsonp([{message:"ticket booked successfuly!!.."}]);

    }            
});


app.get('/bookingToviewMore',async(req,res) =>{
 
  const comments = await commentList.find({ eventName: req.query.eventName,
    eventId:req.query.eventId
   });
  const  events  =  await eventStatus.find( {eventName: req.query.eventName,userName: req.query.username 
  });
  
  
  if (events.length===0) {
    
  const newUser = new eventStatus({
    eventName: req.query.eventName,
    userName: req.query.username,

    status: false,

  });
  
  newUser.save().then(( ) => {
    console.log("success");
  }).catch(()=>{
console.log("sory");
  })
  }
  

  const  allEvents  =  await eventStatus.find( {eventName: req.query.eventName,userName: req.query.username 
  });
  

  let color1, color2;
  if(!allEvents){
   return  res.send("try again");
  }
  if (allEvents[0].status === true) {
    color1 = "blue";
    color2 = "black"
  } else {
    color1 = "black";
    color2 = "blue"
  }
 
 res.render('viewMore.hbs',{
  description: req.query.description,
  bookingStartTime: req.query.bookingStartTime,
  bookingEndTime: req.query.bookingEndTime,
  cost: req.query.cost,
  maxNoOfTicket: req.query.maxNoOfTicket,
  eventName:req.query.eventName,
  username: req.query.username,
  comments:comments,
  eventId:req.query.eventId,
  likes: req.query.likes,
  // color1:color1,
  // color2:color2,
  status: allEvents[0].status,
  color1: color1,
  color2: color2,
  image:req.query.image

 });


});

app.get('/eventAddingToEventlist',async(req,res) =>{
  const events = await eventList.find( { }, {
    eventName: 1,
    description: 1,
    maxNoOfTicket: 1,
    bookingStartTime: 1,
    bookingEndTime: 1,
    cost: 1,
  image:1,
    _id: 1
  });
  if (events) {
    res.render('eventView.hbs',{
      events: events
    });
  } 
});

app.get('/editingToHome',async(req,res) =>{
  const events = await eventList.find( { }, {
    eventName: 1,
    description: 1,
    maxNoOfTicket: 1,
    bookingStartTime: 1,
    bookingEndTime: 1,
    cost: 1,
  image:1,
    _id: 1
  });
  if (events) {
    res.render('eventView.hbs',{
      events: events
    });
  } 
});

app.get("/eventStatus",async(req,res) => {
  console.log(req.query.eventName+""+req.query.image+""+req.query.description);
  const soldTicket = await bookedTickets.find({eventName:req.query.eventName,
  description:req.query.description,
  image:req.query.image
  });
  const likes = await eventStatus.find({
    status:true,
    eventName:req.query.eventName
  });
  const comments =await commentList.find({
    eventName:req.query.eventName
  });
  console.log(soldTicket);;
  res.render("eventDetails.hbs",{
    soldTicket:soldTicket,
    likes :likes,
    comments:comments

  })
});
app.get('/eventdetailsToeventList',async(req,res )=>{
  const events = await eventList.find( { }, {
    eventName: 1,
    description: 1,
    maxNoOfTicket: 1,
    bookingStartTime: 1,
    bookingEndTime: 1,
    cost: 1,
  image:1,
    _id: 1
  });
  if (events) {
    res.render('eventView.hbs',{
      events: events
    });
  } 

})

//app.use(express.urlencoded());
app.use(express.json()); 


app.listen(port , () => {
  console.log('server is up to port :' + port);
});