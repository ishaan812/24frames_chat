const { instrument }= require('@socket.io/admin-ui');
const express = require('express');
const cors = require('cors');
const https = require('https');
const mysql= require('mysql');
const { Console } = require('console');
const app=express();
const dotenv = require('dotenv');
const server= https.createServer(app);
const io = require("socket.io")(server,
    {
        // transports: ["websocket"],
        cors: {
            origin: '*',
        }
        // pingInterval: 1000 * 60 * 5,
        // pingTimeout: 1000 * 60 * 3
        
    });
var usertable= new Map();
var name;
var UserID;
var users;
var ids;
var activeusers= [];
var roomsavailable= {};
    
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
    setInterval(()=>{socket.emit("activeuserlist", activeusers)},5000);
    
    socket.on("sendusername", async(Name) => {
        selectUsertablesql= "SELECT * FROM `username`";
        con.query(selectUsertablesql, async(err, result) => {
            if(err) throw err;
            result.forEach(element => {
                usertable.set(element.UID, element.Username);
            }); 
            name=Name; 
            users= [...usertable.values()];
            setTimeout(()=>{},2000);
            if(users.includes(Name)){
                updatesql= "UPDATE `username` SET `Socket`='"+socket.id+"' WHERE Username='"+ Name + "'";
                con.query(updatesql, function (err, result) {
                    if (err) throw err;
                    ids= [...usertable.keys()];
                    UserID=ids[users.findIndex(Name=>Name===name)];
                });
                activeusers.push(Name);
                socket.emit("activeuserlist", activeusers)
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
                activeusers.push(Name);
                socket.emit("activeuserlist", activeusers)
            }
        });
    })

    socket.on("getroomlist", async(Name) => {
        selectUsertablesql= "SELECT UID FROM `username` WHERE Username='"+Name+"'";
        roomsavailable[Name+"rooms"]=[];
        con.query(selectUsertablesql, async(err, result) => {
            if(err) throw err;
            UserID=result[0].UID;
            GetRoomssql= "SELECT * FROM `rooms` WHERE UID="+UserID;
            con.query(GetRoomssql, async(err, roomlist) => {
                if(err) throw err;
                roomlist.forEach(element => { 
                    con.query("SELECT RoomName FROM `roominfo` WHERE RoomID='"+element.RoomID+"'", function (err, roominfo) {
                        if(err) throw err;
                        socket.emit("roomlist", roominfo[0].RoomName);
                    })
                })
                
            });
        })
    })

    socket.on("getpreviousmessages", (room) =>{
        if(room!=="" || room!=="general"){
            socket.join(room);
        }
        con.query("SELECT * FROM messages WHERE Roomname = '"+room+"'", (err, result) => {
            if (err) throw err;
            result.forEach(element => {
                element.Name=usertable.get(element.UID);
            })
            socket.emit("previousmessages", result);
        });
    }) 
    
    socket.on("sendmessage", (message, room, name) => {
        UserID=ids[users.findIndex(Name=>Name===name)];
        if(room === '' || room === "general"){
            socket.broadcast.emit("recievemessage", message, name);
            selectid= "SELECT `UID` FROM `username` WHERE Username='"+name+"'";
            con.query (selectid, (err, result)=> {
                if (err) throw err;
                generalroom="general"
                generalmessagesql= "INSERT INTO `messages`(`DateSent`, `UID`, `Message`, `Roomname`) VALUES (NOW(),'"+UserID+"','"+message+"','"+generalroom+"')";
                con.query(generalmessagesql, (err, result)=> {
                    if (err) throw err;
                    console.log(result);
                })
            })
        } 
        else{
            io.to(room).emit("recievemessage", message, name);
            selectid= "SELECT `UID` FROM `username` WHERE Username='"+name+"'";
            con.query (selectid, (err, result)=> {
                if (err) throw err;
                messagesql= "INSERT INTO `messages`(`DateSent`, `UID`, `Message`, `Roomname`) VALUES (NOW(),'"+UserID+"','"+message+"','"+room+"')";
                con.query(messagesql, (err, result)=> {
                    if (err) throw err;
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
                if(result[0].RoomName===roomname){
                    socket.join(roomname);
                    socket.emit("roomexists",roomname);
                }
                else{
                    socket.join(altroomname);
                    socket.emit("roomexists",altroomname);
                }
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

    socket.on("creategrouproom", (groupname, UserName) => {
        creategroupsql="INSERT INTO `roominfo`(`RoomID`, `Roomname`, `UserLimit`, `DateCreated`) VALUES (NULL,'"+groupname+"',100, NOW())";
        con.query(creategroupsql, (err, result)=> {
            con.query("SELECT * FROM roominfo WHERE Roomname='"+groupname+"'", (err, result)=>{
                roomid=result[0].RoomID;
                con.query("INSERT INTO `rooms`(`RoomID`, `UID`, `DateJoined`) VALUES ("+roomid+","+ids[users.findIndex(Name=>Name===UserName)]+", NOW())", (err, result)=>{
                })
            })
        })
        socket.join(groupname);
        socket.emit("groupcreated", groupname);
    })

    socket.on("joinprivateroom", (roomname) => {
        socket.join(roomname);
        socket.emit("roomcreated", roomname);
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
        var newuserlist= [];
        // room="general";
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
                    if(result.length!==0)
                    {
                    result.forEach(element => {
                        element.Name=usertable.get(element.UID);
                        newuserlist.push(element.Name);
                    })
                    socket.emit("userlist", newuserlist);
                    }
                    else{
                        socket.emit("EMPTYROOM");
                    }
                })
                
            })
            }
        }
    )

    // socket.on("calluser", (data)=>{
    //     console.log(data);
    //     io.to(data.UserToCall).emit("callrequest", {signal: data.signalData, callerId: data.callerId, Name: data.Name});
    // })


    socket.on("disconnect", () => {
        
        console.log("disconnected" + socket.id);
        con.query("SELECT * FROM `username` WHERE Socket='"+socket.id+"'", (err, result)=> {
            if(err) throw console.log("username error");
            if(result.length===0){console.log("UserError")}
            else{
                Username= result[0].Username;
                activeusers.splice(activeusers.indexOf(Username), 1);
            }
        })
        socket.broadcast.emit("disconnectlol"); 
    })

    
    
})


server.listen(process.env.PORT, () => {
    console.log("Server started on port "+ process.env.PORT);
});