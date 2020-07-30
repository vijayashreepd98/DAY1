const express = require('express');
const session = require("express-session");
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
const app = express();
require('./src/db/mongoose');
const port = process.env.PORT || 3000;
const customerModel = require('./src/models/registerModel.js');
const eventList = require('./src/models/eventModel.js');
const commentList = require('./src/models/addComment.js');
const eventStatus = require('./src/models/likeModel.js');
const bookedTickets = require('./src/models/ticketModel.js');
const { doesNotMatch } = require('assert');
const { send } = require('process');

app.use(session({secret: 'vijaya',saveUninitialized: true,resave: true}));

app.set('view engine', 'hbs');

hbs.registerHelper('if_eq', function(a, b, opts) {
    if(a%b==0&&a!=0)
        return opts.fn(this);
    else
        return opts.inverse(this);
});
hbs.registerHelper('json',function(context){
  return JSON.stringify(context);
});


const flash = require('connect-flash');

app.use(express.urlencoded());
app.use(express.json()); 
app.use(express.static('./uploads/'));


//UPLAODING FILE TO SPECIFIED LOCATION
let storage = multer.diskStorage({
  destination:function(req,file,cb) {
    cb(null, 'uploads/');
    
  },


  filename:function(req,file,cb){
    cb(null,file.originalname);
  }
})

let upload = multer({
  storage:storage
})



// HOME PAGE
let sess;
app.get('/' ,(req, res) => {
  
  res.sendfile( './views/home.html');
});

//ADMIN LOGIN PAGE
app.get('/adminLogin',(req, res) => {
  res.sendfile('./views/adminLogin.html');
});

//ADMIN LOGIN CREDENTIAL VALIDATION
app.post('/adminLogin',async(req,res,next) => {
  let name = req.body.username;
  let password = req.body.password;
  


  if( name === 'admin' && password === 'admin') {
    console.log('success');
    res.send("success");
  
  }else{
    console.log("fail");
    res.send("fail");
 }

});

//ADMIN HOME PAGE CONATINING LIST OF EVENTS
app.get('/adminHome',async(req,res) => {
  let events = await eventList.find( { }, {
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
app.get('/userRegistration',(req, res) => {
  
  res.sendfile('./views/userRegistration.html');
});

//UPADTING USER CREDENTIAL IN DATABASSE
app.post('/userRegistration', async(req, res) => {
  let name = req.body.username;
  let password = req.body.password;
  
  let registered = await customerModel.findOne({name:name});
    if(registered){
       res.send("USER ALREADY EXISTS!!!...");
    }
    else{
      let events = await eventList.find({
        
      },{
        eventName:1
      });
      for(let i=0;i<events.length;i++){
        let newUser = await new eventStatus({
          eventName: events[i].eventName,
          userName: name,
          status: false,
      });
      newUser.save();
      }
      const register = new customerModel({
      name: name,
      password: password
    });
    
    register.save().then(async() => {
      req.session.name = name;
      req.session.password = password;
      res.send("success");
    }).catch(() => {
      res.send("fail");
    });
  }

});

//ADMIN ADDING NEW EVENTS
app.get('/adminAddingEvent',(req,res) =>{
 res.sendfile('./views/addingEvent.html')
});


// adding event details to database
app.post('/adminAddingEvent',upload.single('img'),async(req,res) => {
  let ename = req.body.ename;
  let edetails = req.body.edetails;
  let npeople = req.body.maxNoOfTicket;
  let bookingStartTime = req.body.stime;
  let bookingEndTime = req.body.etime;
  let cost = req.body.cost;
  let image = req.file.filename;
  let sdate = dateFormat(bookingStartTime,"d-mm-yyyy  @ h:MM:ss");
  let edate = dateFormat(bookingEndTime,"d-mm-yyyy  @ h:MM:ss");
  console.log(ename);
  const events= await eventList.findOne({eventName:ename});
  if(events){
   return  res.send("EVENT WITH SAME NAME ALREADY PRESENT IN THE EVENT LIST....\nYOU CANNOT ADD...!!");
  }
  if(bookingStartTime>bookingEndTime){
   return res.send("EVENT BOOKING STARTING AND ENDING DATES ARE NOT PROPER \n... PLEASE DO CHECK!!..")
  }
  

  if(!image){
    return res.send("Please upload a file");

  }else{
    if (image === "" || ename === "" || edetails === "" ||npeople === "" ||bookingStartTime === "" || bookingEndTime === "" || cost === "") {
      return res.send('Please provide valid information ..All are mandatory');
    }
    let customer = await customerModel.find({
        
    },{
      name:1
    });
    for(let i=0;i<customer.length;i++){
      let newUser =  new eventStatus({
        eventName: ename,
        userName: customer[i].name,
        status: false,
    });
    newUser.save();
    }
    let addEventDetails = new eventList({
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
      
      return res.send("EVENT ADDED SUCCESSFULLY!!!");
      }).catch(() => {
      return res.send("Sorry...Failed to add new event!!!...");
    }); 
  }
});

//ADMIN EDDITING EXISTING EVEN DETAILS
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

//UPADTING EVENT DETAILS IN DATABASE
app.post('/editEvent' , async (req,res) =>{
  let editedView = await eventList.findOneAndUpdate({
    eventName: req.body.eventName
  }, {
    description: req.body.description,
    bookingStartTime: req.body.stime,
    bookingEndTime: req.body.eetime,
    cost: req.body.cost,
    maxNoOfTicket: req.body.maxNoOfTicket
  });
  
  if (editedView) {
    return res.jsonp([{message:"updated event successfully!"}]);
  } else {
    return res.send('failure while updating!!!!');
  }
});

//DELETING EVENT
app.post('/deleteEvent', async (req, res) => {  
  let deletedEvent = await eventList.findOneAndDelete({
    eventName: req.body.eventName,
    description:req.body.description,
    maxNoOfTicket:req.body.maxNoOfTicket,
    bookingStartTime:req.body.stime,
    bookingEndTime:req.body.eetime,
    cost:req.body.cost

  });
  let deletedView = await commentList.deleteMany({
    eventName: req.body.eventName 
  });
  let eventStatuss =  await eventStatus.deleteMany({
     eventName:req.body.eventName
   });
  if (deletedEvent) {
    return  res.jsonp([{message:"Event deleted successfuly!!.."}]);
  } else {
    return  res.jsonp([{message:"Failed to delete the event!!!.."}]);
 }

});




//USER HOME PAGE
app.get("/userHomePage",async(req,res) =>{
  
  let day = new Date();
  let today = day.getDate()+'/'+(day.getMonth()+1)+'/'+day.getFullYear()+'@ '+day.getHours()+
  ':'+day.getMinutes()+':'+day.getSeconds();    const events = await eventList.find( { 
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
    res.render('userEventView.hbs', {
      events:events,
      username:req.query.username
      });
    }
   
});

//USER LOGIN 
app.get('/userLogin',(req, res) => {
  res.sendfile('./views/userLogin.html');
  
});

//VALIDATING USR CREDENTIAL
app.post('/userLogin',async(req,res)=> {
  let name = req.body.name;
  let password = req.body.password;
  
  let user = await customerModel.findOne( {
    name:name,
    password: password
  });

  if(user){

    
    res.send("success");
  } else {
    res.send("fail")
  }
});

//USER VIEWING MORE INFORMATION OF PERTICULAR EVENT
app.get('/viewMore',async(req,res) =>{

  let comments = await commentList.find({ eventName: req.query.eventName,
    eventId:req.query.eventId
   });
   const  allEvents  = await  eventStatus.findOne( {eventName: req.query.eventName,userName: req.query.username 
    });
  
  
console.log(allEvents.status);
  let color1, color2;
  if(!allEvents){
   return  res.send("try again");
  }
  if (allEvents.status === true) {
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
    status: allEvents.status,
    color1: color1,
    color2: color2,
    image:req.query.image

 });

  
});

//PREVIOUS BUTTON FROM BOOKING EVENT DETAILS TO USER HOME PAGE
app.get('/bookingToHome',async(req,res)=>{

  let comments = await commentList.find({ eventName: req.query.eventName,
    eventId:req.query.eventId
  });
   let  events  =  await eventStatus.find( {eventName: req.query.eventName,userName: req.query.username 
  });
  
  if (events.length===0) {
    let newUser = new eventStatus({
    eventName: req.query.eventName,
    userName: req.query.username,

    status: false,

  });
  newUser.save().then(( ) => {
    console.log("success");
  }).catch(()=>{
    console.log("Failed");});
  }
  let  allEvents  =  await eventStatus.find( {eventName: req.query.eventName,userName: req.query.username 
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

  });
  
});

//EVENT STATUS UPFDATED FOR PERTICULAR EVENT WITH RESPECT TO PERTICULAR EVENT
app.post('/liked',async (req,res)=>{

  let event = await eventList.findOneAndUpdate({
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
 
  let activity = await eventStatus.findOneAndUpdate({
    userName: req.body.userName, 
    eventName: req.body.eventName
  }, {
    status: status,
    likes: req.body.like 
    });
  
});

//STORING USER INSERTED COMMET INTO DATABASE WITH USERNAME
app.post('/addComment', async(req, res) => {
  console.log(req.body.userName); 

  let addComment = new commentList({
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
     }]);
    }).catch(()=>
    {
     console.log("sorry");
    });
  
});

//USER BUYING EVENT TICKET
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
    status:req.query.status,
    color1: req.query.color1,
    color2: req.query.color2,
    image:req.query.image

    });
  
 });

 //UPDATING BOOKED TICKET IN DATABASE
app.post('/bookedTicket',async(req,res) => {

  let day =new Date();
  let today = day.getDate()+'/'+(day.getMonth()+1)+'/'+day.getFullYear()+'@ '+day.getHours()+
        ':'+day.getMinutes()+':'+day.getSeconds();
  let datetimes = req.query.bookingEndTime;
  if  (today  > datetimes) {
    return res.jsonp([{message:"event already ended"}]);
    }
  let event = await eventList.findOne( { 
    eventName: req.query.eventName
  });
  console.log(event)
  if (req.body.number > event.maxNoOfTicket) {
    return res.jsonp([{message:"You cant book more ticket..Avalable ticket is "+event.maxNoOfTicket}]);
  }
  let newNoOfTicket = event.maxNoOfTicket - req.body.number;
  let updateTicket = await eventList.findOneAndUpdate({
    eventName: req.query.eventName
  }, {
    maxNoOfTicket : newNoOfTicket
  });

  if (updateTicket) {
    console.log('updated successfully!!!');
  } else {
    console.log('failed to update the ticket count!!!');
  }
  let soldTicket = new  bookedTickets( {
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

 //VIEWING SOLD TICKET LIST
app.get('/soldTicketList', async(req,res) => {

  let soldTicket = await bookedTickets.find( {userName: req.query.username
  
  }, {
    eventName: 1,
    userName: 1,
    noOfTicket :1,
    bookingTime: 1,
    cost: 1,
    paid: 1,
    image:1
  }); 
  let events = req.query.events;
  res.render('purchasedTickets.hbs',{
    soldTicket:soldTicket,
    username:req.query.username,
   
   });
  
});

//PREVIOUS BUTTON FROM PURCHASE HISTORY TO USER HOMW PAGE
app.get('/purchaseToHome',async(req,res) =>{

  let events = await eventList.find( { 
    
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
    }else{
      

    }  
           
});


//PREVIOUS BUTTON FROM VIEW MORE PAGE TO USER HOME PAGE

app.get('/viewMoreToHome',async(req,res) =>{

  let events = await eventList.find( { 
    
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
    } else {
     
    }       
         
});

//PREVIOUS FROM BOOKING PAGE TO VIEW MORE PAGE 
app.get('/bookingToviewMore',async(req,res) =>{

 
  let comments = await commentList.find({ eventName: req.query.eventName,
    eventId:req.query.eventId
   });
  let  events  =  await eventStatus.find( {eventName: req.query.eventName,userName: req.query.username 
  });
  
  if (events.length===0) {
    let newUser = new eventStatus({
      eventName: req.query.eventName,
      userName: req.query.username,
      status: false,
    });
    newUser.save().then(( ) => {
      console.log("success");
    }).catch(()=>{
      console.log("sory");
    });
  }
  let eventLists = await eventList.findOne({
    eventName:req.query.eventName
  },{
    likes:1
  });
  let  allEvents  =  await eventStatus.find( {eventName: req.query.eventName,userName: req.query.username 
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
    likes: eventLists.likes,
    status: allEvents[0].status,
    color1: color1,
    color2: color2,
    image:req.query.image

 });

  
});

//PREVIOUS BUTTON FROM ADMIN EVENT ADDING TO EVENT LIST
app.get('/eventAddingToEventlist',async(req,res) =>{
  

  let events = await eventList.find( { }, {
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

  let events = await eventList.find( { }, {
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
 

 
  let soldTicket = await bookedTickets.find({eventName:req.query.eventName,
  description:req.query.description,
  image:req.query.image
  });
  let likes = await eventStatus.find({
    status:true,
    eventName:req.query.eventName
  });
  let comments =await commentList.find({
    eventName:req.query.eventName
  });
 
  res.render("eventDetails.hbs",{
    soldTicket:soldTicket,
    likes :likes,
    comments:comments,
    eventName:req.query.eventName

  });

});
app.get('/eventdetailsToeventList',async(req,res )=>{
 

  let events = await eventList.find( { }, {
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
app.get('/logout',(req,res)=>{
  
    res.redirect('/');
});


  

app.use(express.json()); 


app.listen(port , () => {
  console.log('server is up to port :' + port);
});