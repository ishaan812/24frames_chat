const { instrument }= require('@socket.io/admin-ui');
const express = require('express');
const cors = require('cors');
const http = require('http');
const httpProxy = require("http-proxy");
const mysql= require('mysql');
const { Console } = require('console');
const app=express();
const dotenv = require('dotenv');
const server= http.createServer(app);
const io = require("socket.io")(server,
    {
        transports: ['websocket'],
        cors: {
            origin: '*',
        }
    });
var usertable= new Map();
var name;
var UserID;
var users;
var ids;
var activeusers= [];
var roomsavailable= {};
var j;
    
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
    setInterval(()=>{socket.emit("userlist", users,activeusers)},5000);
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
                    activeusers.push(Name);
                    // socket.emit("activeuserlist", activeusers)
                });
            }
            else{
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
                        activeusers.push(Name);
                        // socket.emit("activeuserlist", activeusers)
                    })
                });
            }
        });
    })
    
    // socket.on("getroomlist", (Name) => {
    //     selectUsertablesql= "SELECT UID FROM `username` WHERE Username='"+Name+"'";
    //     roomsavailable[Name]= [];
    //     con.query(selectUsertablesql, async(err, result) => {
    //         UserID= result[0].UID;
    //         joinsql="SELECT roominfo.RoomName,rooms.UID FROM `rooms` join roominfo on rooms.RoomID = roominfo.RoomID where rooms.UID="+UserID;
    //         con.query(joinsql, async(err, result) => {
    //             socket.emit("roomlist",result);
    //         })
    //     })

        
    // })
    
    socket.on("getpreviousmessages", (room) =>{
        
        if(room!=="general"){socket.join(room);}

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
        if(message==="") socket.emit("badinput");
        else if(room === '' || room === "general"){
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
            // console.log(room);
            socket.to(room).emit("recievemessage", message, name);
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
        socket.emit("roomcreated", roomname);
        socket.join(roomname);
    })

    socket.on("getuserlist",()=>{
        if(users!=null)
        {
            socket.emit("userlist", users, activeusers);
        }
    })

    

    // socket.on("calluser", (data)=>{
    //     console.log(data);
    //     io.to(data.UserToCall).emit("callrequest", {signal: data.signalData, callerId: data.callerId, Name: data.Name});
    // })


    socket.on("disconnect", () => {
        socket.broadcast.emit("call disconnect"); 
        console.log("disconnected " + socket.id);
        
        socket.disconnect();
        con.query("SELECT * FROM `username` WHERE Socket='"+socket.id+"'", (err, result)=> {
            if(err) throw console.log("username error");
            if(result.length===0){console.log("UserError")}
            else{
                Username= result[0].Username;
                activeusers.splice(activeusers.indexOf(Username), 1);
            }
        })
    })

    
    
})

// httpProxy
//   .createProxyServer({
//     target: "http://localhost:3000",
//     ws: true,
//   })
//   .listen(80);






server.listen(process.env.PORT, () => {
    console.log("Server started on port 3000");
});