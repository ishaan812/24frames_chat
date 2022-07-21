const { instrument }= require('@socket.io/admin-ui');
const express = require('express');
const cors = require('cors');
const http = require('http');
const mysql= require('mysql');
const { Console } = require('console');
const app=express();
const dotenv = require('dotenv');
const server= http.createServer(app);
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
var userlist;
    
dotenv.config();
app.use(express.json())
app.use(cors());

app.get("/", (req, res) => {
    res.send("Hello World!");
})


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

    socket.on("getroomlist", async(userid) => {
        selectRoomsql= "SELECT * FROM `rooms` WHERE UID='"+userid+"'";
        con.query(selectRoomsql, async(err, roomlist) => {
            if(err) throw err; 
            socket.emit("roomlist", roomlist);
        });
    })



    socket.on("getpreviousmessages", (room) =>{
        con.query("SELECT * FROM messages WHERE Roomname = '"+room+"'", (err, result) => {
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

    socket.on("createprivateroom", (sendername, otherusername) => {
        //create the room in roominfo table
        senderid= ids[users.findIndex(Name=>Name===sendername)];
        otheruserid= ids[users.findIndex(Name=>Name===otherusername)];
        
        if(otheruserid===-1){
            socket.emit ("badinput");
        }

        // console.log(senderid);
        else{
            roomname= sendername+"_"+otherusername;
            altroomname= otherusername+"_"+sendername;
            
        con.query("SELECT * FROM roominfo WHERE RoomName='"+roomname+"' OR RoomName='"+altroomname+"'", (err, result) => {
            if(err) throw err;
            if(result.length!==0){
                socket.emit("roomexists");
            }
            else{
                createroominfosql="INSERT INTO `roominfo`(`RoomID`, `Roomname`, `UserLimit`, `DateCreated`) VALUES (NULL,'"+roomname+"',2, NOW())";
                con.query(createroominfosql, (err, result)=> {
                    if (err) throw err;
                    selectidsql= "SELECT `RoomID` FROM `roominfo` WHERE Roomname='"+roomname+"'";
                    con.query(selectidsql, (err, result)=> {
                        if(err) throw err;
                        roomid=result[0].RoomID;
                        
                        // console.log(roomid)
                        //create the room in roomusers table
                        addroomusersql="INSERT INTO `rooms`(`RoomID`, `UID`, `DateJoined`) VALUES ("+roomid+","+senderid+", NOW())";
                        addotherroomusersql="INSERT INTO `rooms`(`RoomID`, `UID`, `DateJoined`) VALUES ("+roomid+","+otheruserid+", NOW())";
                        con.query(addroomusersql, (err, result)=> {})
                        con.query(addotherroomusersql, (err, result)=> {})
                    })
                })

                getothersocketsql= "SELECT `Socket` FROM `username` WHERE UID='"+otheruserid+"'";
                con.query(getothersocketsql, (err, result)=> {
                    othersocketaddress=result[0].Socket;
                    console.log(othersocketaddress);
                    socket.broadcast.to(othersocketaddress).emit("privateroomrequest", roomname);
                })
                
                socket.join(roomname);
                socket.emit("roomcreated", roomname);
            }  
        })
        }
    })

    socket.on("joinprivateroom", (roomname) => {
        socket.emit("roomcreated", roomname);
        socket.join(roomname);
    })

    
    // socket.on("joinroom", (room) => {
    //     socket.join(room);
    //     selectid= "SELECT `UID` FROM `username` WHERE Username='"+name+"'";
    //     con.query (selectid, (err, result)=> {
    //         if (err) throw err;
    //         console.log(UserID);
    //         insertroom= "INSERT INTO `rooms` (`RoomName`, `UID`, `DateJoined`) VALUES ('"+room+"', '"+UserID+"', NOW())";
    //         con.query (insertroom, (err, result)=> {
    //             if(err) throw err;
    //             console.log(result);
    //         });
    //     });

    // });

    socket.on("getuserlist",(room)=>{
        if(room === '' || room === "general"){
            socket.emit("userlist", users);
        }
        else{
            selectroomidsql="SELECT `RoomID` FROM `roominfo` WHERE Roomname='"+room+"'";
            con.query(selectroomidsql, (err, result)=> {
                roomid=result[0].RoomID;
                userlistsql= "SELECT UID FROM `rooms` WHERE RoomID='"+roomid+"'";
                con.query (userlistsql, (err, result)=> {
                    if (err) throw err;
                    result.forEach(element => {
                        element.Name=usertable.get(element.UID);
                        console.log(element.Name);
                        userlist.append(element.Name);
                        userset = new Set(userlist);
                        userroomlist= new Array(userset);
                })
                socket.emit("userlist", userroomlist);
            })
            })
        }
    })

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