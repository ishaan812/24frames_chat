const { instrument }= require('@socket.io/admin-ui');
const express = require('express');
const cors = require('cors');
const http = require('http');
const mysql= require('mysql');
const { Console } = require('console');
const app=express();
const dotenv = require('dotenv');
const server= http.createServer(express());
const io = require("socket.io")(server,
    {
        cors: {
            origin: '*',
        }
    });
var usertable= new Map();
var name;
var UserID;
var users;
var ids;
    
dotenv.config();
app.use(express.json())
app.use(cors());


var con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});


io.on("connection", async(socket) => {
    console.log(socket.id);
    socket.on("sendusername", async(Name) => {
        selectUsertablesql= "SELECT * FROM `username`";
        
        con.query(selectUsertablesql, async(err, result) => {
            if(err) throw err;
            result.forEach(element => {
                usertable.set(element.UID, element.Username);
            }); 
            
            name=Name; 

            users= [...usertable.values()];
            if(users.includes(Name)){
                updatesql= "UPDATE `username` SET `Socket`='"+socket.id+"' WHERE Username='"+ Name + "'";
                con.query(updatesql, function (err, result) {
                    if (err) throw err;
                    ids= [...usertable.keys()];
                        UserID=ids[users.findIndex(Name=>Name===name)];
                });
            }
            else{
                console.log("newuser");
                adduserquery="INSERT INTO `username` (`UID`, `Username`, `Socket`, `Date Created`) VALUES (NULL, '"+name+"', '"+socket.id+"', NOW())";
                con.query(adduserquery, function (err, result) {
                    if (err) throw err;
                    con.query(selectUsertablesql, async(err, result) => {
                        if(err) throw err;
                        result.forEach(element => {
                            usertable.set(element.UID, element.Username);
                            users= [...usertable.values()];
                        });
                        ids= [...usertable.keys()];
                        UserID=ids[users.findIndex(Name=>Name===name)];
                    })
                });
            }
        });
    })

    socket.on("getpreviousmessages", (room) =>{
        con.query("SELECT * FROM messages WHERE Roomname = 'general'", (err, result) => {
            if (err) throw err;
            result.forEach(element => {
                element.Name=usertable.get(element.UID);
            })
            socket.emit("previousmessages", result);
        });
    }) 
    
    socket.on("sendmessage", (message, room, name) => {
        console.log(message);
        UserID=ids[users.findIndex(Name=>Name===name)];
        
        if(room === ''){
            socket.broadcast.emit("recievemessage", message, name);
            selectid= "SELECT `UID` FROM `username` WHERE Username='"+name+"'";
            con.query (selectid, (err, result)=> {
                if (err) throw err;
                generalroom="general"
                generalmessagesql= "INSERT INTO `messages`(`DateSent`, `UID`, `Message`, `Roomname`) VALUES (NOW(),'"+UserID+"','"+message+"','"+generalroom+"')";
                con.query(generalmessagesql, (err, result)=> {
                    if (err) throw err;
                    console.log(result)
                })
            })
        }

        else{
            messagestring= room+":  "+message
            socket.broadcast.to(room).emit("recievemessage", messagestring);
            selectid= "SELECT `UID` FROM `username` WHERE Username='"+name+"'";
            con.query (selectid, (err, result)=> {
                console.log(result);
                if (err) throw err;
                messagesql= "INSERT INTO `messages`(`DateSent`, `UID`, `Message`, `Roomname`) VALUES (NOW(),'"+UserID+"','"+message+"','"+room+"')";
                con.query(messagesql, (err, result)=> {
                    if (err) throw err;
                    console.log(result)
                })
            })
        }
    });
    
    socket.on("joinroom", (room) => {
        selectid= "SELECT `UID` FROM `username` WHERE Username='"+name+"'";
        con.query (selectid, (err, result)=> {
            if (err) throw err;
            console.log(UserID);
            insertroom= "INSERT INTO `rooms` (`RoomName`, `UID`, `DateJoined`) VALUES ('"+room+"', '"+UserID+"', NOW())";
            con.query (insertroom, (err, result)=> {
                if(err) throw err;
                console.log(result);
            });
        });
        socket.join(room);
    });

    // socket.on("calluser", (data)=>{
    //     console.log(data);
    //     io.to(data.UserToCall).emit("callrequest", {signal: data.signalData, callerId: data.callerId, Name: data.Name});
    // })


    // socket.on("disconnect", () => {
    //     socket.broadcast.emit("call disconnect"); 
    //     console.log("disconnected " + socket.id);
    // })

    
    
})


instrument(io, {auth: false })

server.listen(process.env.PORT, () => {
    console.log("Server started on port 3000");
});