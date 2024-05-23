const express=require('express')
const app=express()
const dotenv=require('dotenv')
const ConnectDB=require('./config/db.js')
const userRoutes=require('./routes/userRoutes.js')
const messageRoutes=require('./routes/messageRoutes.js')
const chatRoutes=require('./routes/chatRoutes.js')
const path = require('path');
const { notFound, errorHandler } = require('./middleware/errorMiddleware.js')

dotenv.config()//This line invokes the config method of the dotenv module, which loads 
//the variables from your .env file into process.env.
ConnectDB()

app.use(express.json()) //you're telling Express to use the express.json() middleware 
//for all incoming requests so that the application can automatically parse JSON 
//data in the request bodies and make it available in the req.body property for further processing within your routes or other middleware. 
app.use('/api/user',userRoutes)
app.use('/api/chat',chatRoutes)
app.use('/api/message',messageRoutes)
// app.use() is used to mount middleware functions in Express.js

// --------------------------deployment------------------------------
const __dirname1 = path.resolve();
if (process.env.NODE_ENV === "production"){
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// --------------------------deployment------------------------------

app.use(notFound)
app.use(errorHandler)
const PORT=process.env.PORT||2500 //default port is 2500
const server=app.listen(PORT,console.log("Server started on port "+PORT))

const io=require('socket.io')(server,{
    pingTimeout:60000,
    cors:{
        origin:"http://localhost:3000"
    },
});

io.on('connection',(socket)=>{
    console.log("Connected to Socket.IO")

    socket.on("setup",(userData)=>{
        socket.join(userData._id)
        socket.emit("connected")
    })

    socket.on('join chat',(room)=>{
        socket.join(room)
        console.log("User Joined "+room)
    })

    socket.on("typing",(room)=>socket.in(room).emit("typing"))
    socket.on("stop typing",(room)=>socket.in(room).emit("stop typing"))
    

    socket.on('new message',(newMessageRecieved)=>{
        var chat=newMessageRecieved.chat
        if(!chat.users)return console.log('chat.users is not defined')
        chat.users.forEach((user)=>{
            if(user._id===newMessageRecieved.sender._id)return
            socket.in(user._id).emit("message recieved",newMessageRecieved)
    })
    })
    socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
})