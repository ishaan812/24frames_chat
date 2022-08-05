import React,{useEffect, useState, useRef} from "react";
import io from 'socket.io-client'
import Peer from "simple-peer";
import Editor from "./editor";
import {
  BrowserRouter as Router,
  useParams,
  useNavigate,
  Link
} from "react-router-dom";
import { data } from "autoprefixer";
import './assets/css/chatstyle2.css'
import Avatar1 from './assets/Images/avtar1.png'
import Avatar from './assets/Images/avtar1.png'
import Logo from './assets/Images/logo.png'
import { AiOutlineSend } from 'react-icons/ai'
import ScrollToBottom, { useScrollToBottom } from "react-scroll-to-bottom";

var socket;
function App({Type}) {
  const [Id, setId] = useState("");
  const [Stream, setStream] = useState();
  const [recievingCall, setRecievingCall] = useState(false);
  const [callerId, setCallerId] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const Name= useParams().name;
  const [CallAccepted, setCallAccepted] = useState("");
  const [callended, setcallended] = useState("");
  const [Message, setMessage] = useState();
  const [Room,SetRoom] = useState("general");
  const [otherusername, Setotherusername] = useState("");
  const [groupname,Setgroupname]= useState("");
  const [activeroom,Setactiveroom]= useState("generalchat");
  const [i,seti]=useState(0);
  const navigate =useNavigate();
  const scroller= useScrollToBottom();



  // const myvideo= useRef(null);
  // const uservideo= useRef(null);
  // const connectionref = useRef(null);



  

  const displayMessage=(message,name)=>{
    const messagebox= document.createElement("div");
    seti(i+1);
    messagebox.style.width="100%";
    messagebox.style.marginBottom="10px";
    if(name===Name){
      messagebox.innerHTML= "<div class= 'senderuser' id='message' style=''><strong>"+name+"</strong>:<br/>"+message+"</div>";
    }
    else{
      messagebox.innerHTML= "<div class= 'receiveruser' id='message' style=''><strong>"+name+"</strong>:<br/>"+message+"</div>";
    }
    document.getElementById("chatwindow").appendChild(messagebox);
    document.getElementById("chatwindow").scrollTop=document.getElementById("chatwindow").scrollHeight;
    
  }
  
  const displayUsers=(users,activeusers)=>{
    let userwindow=document.getElementById("userwindow")
    userwindow.innerHTML="";
    var x = document.createElement("img");
    x.setAttribute("src", "./assets/Images/avtar1.png");
    let set1= new Set(users);
    const generalbox= document.createElement("div");
    generalbox.innerHTML="<div class='user1' name='addDom' id='generalchat'><div class='onlineicon'></div><img src='https://images.pexels.com/photos/60597/dahlia-red-blossom-bloom-60597.jpeg?cs=srgb&dl=pexels-pixabay-60597.jpg&fm=jpg'  style='width:50px; height:50px; border: 2px solid #919191; border-radius:100%;'/><h5>General Chat</h5> <div className='onlineicon'></div><hr/></div>";
    userwindow.appendChild(generalbox);
    document.getElementById('generalchat').addEventListener('click', (e)=>{
      RedirecttoRoom('general');
      Setactiveroom("generalchat");
    })
    var activeset= new Set(activeusers);
    activeset.forEach(element => {
      if(element!==Name){
      const userbox= document.createElement("div");
      userbox.innerHTML="<div class='user1' name='addDom' id='user"+element+"'><div class='onlineicon'></div><img src='https://images.pexels.com/photos/60597/dahlia-red-blossom-bloom-60597.jpeg?cs=srgb&dl=pexels-pixabay-60597.jpg&fm=jpg'  style='width:50px; height:50px; border: 2px solid #919191; border-radius:100%;'/><h5>"+element+"</h5> <div className='"+element+"online'></div><hr/></div>";
      userwindow.appendChild(userbox);
      document.getElementById("user"+element).addEventListener('click', (e)=>{
        Setactiveroom("user"+element);
        e.preventDefault();
        RedirecttoRoom(element); 
      })
    }
    })
    set1.forEach(element => {
      if(element!==Name){
        const userbox= document.createElement("div");
        if(activeusers.indexOf(element)===-1){
          userbox.innerHTML="<div class='user1' name='addDom' id='user"+element+"'><img src='https://upload.wikimedia.org/wikipedia/commons/f/f9/Phoenicopterus_ruber_in_S%C3%A3o_Paulo_Zoo.jpg'  style='width:40px; height:40px; border: 2px solid #919191; border-radius:100%;'/><h5>"+element+"</h5> <div className='onlineicon'></div><hr/></div>";
          userwindow.appendChild(userbox);
          document.getElementById("user"+element).addEventListener('click', (e)=>{
          Setactiveroom("user"+element);
          e.preventDefault();
          RedirecttoRoom(element); 
          })
        }
      }

    })
    document.getElementById(activeroom).style.backgroundColor='#e2e2e2';
    
  }
  
  
  
  // useEffect(()=>{
    //   document.getElementById(activeroom).style.backgroundColor="#FF0000";
    // },[activeroom])
    
    const displayRooms=(room)=>{
      const roombox= document.createElement("div");
    roombox.innerHTML= "<button style='border-radius: 4px; background-color: #008CBA; margin-top: 10px; font-size: 20px;'>"+room+"</button>";
    document.getElementById("roomwindow").appendChild(roombox);
  }

  // const displayId=(Id)=>{
  //   const idbox= document.createElement("div");
  //   idbox.innerHTML="<p>"+Name+": "+Id+"</p>";
  //   document.getElementById("id").appendChild(idbox);
  // }

  const MessageChild =(e)=>{
    setMessage(e);
  }

  const SendMessage = (e) => 
  {
    e.preventDefault();
    document.getElementById("texter").value = "";
    
    if(Message == undefined || Message == ""){
      alert("Please enter a message");
    }
    else{
      displayMessage(Message, Name);
      socket.emit("sendmessage", Message, Room, Name);
    }
    setMessage("");
  }

  const RedirecttoRoom = (otherusernamei) => {
    if(otherusernamei!=="general"){
      socket.emit("createprivateroom", Name, otherusernamei);
    }
    else{
      SetRoom("general");
    }
  }

  const RedirecttoGroup = (e) => {
    socket.emit("creategrouproom",groupname, Name);
  }

  useEffect(() => {
    socket= io("server.24fd.com",{  
      transports: ['websocket'],
    });
    // navigator.mediaDevices.getUserMedia({video: true, audio: true}).then((stream)=>{
      //   setStream(stream);
      // myvideo.current.srcObject=stream;
      // });
      socket.on('connect', async()=>{
      // setId(socket.id);
      // displayId(socket.id);
      await socket.emit("sendusername", Name);
      await socket.emit("getpreviousmessages", Room);
      await socket.emit("getuserlist");
      // await socket.emit("getroomlist", Name);

      // socket.on("roomlist", (roomlist)=>{
      //   let roomnames=[];
      //   roomlist.forEach(room=>{roomnames.push(room.RoomName)});
      //   var set= new Set(roomnames);
      //   set.forEach(room=>{displayRooms(room)});
      // })

      socket.on("privateroomrequest", (roomname)=>{
        socket.emit("joinprivateroom", roomname);
      })

      socket.on("roomcreated", (roomname)=>{
        console.log("created room");
        SetRoom(roomname);
        console.log(Room);
        // navigate("/private/"+Name+"/"+roomname);
      })

      socket.on("previousmessages", (data) =>{
        document.getElementById("chatwindow").innerHTML="";
        data.forEach(element => {
            displayMessage(element.Message, element.Name);
          }
        );
        document.getElementById("chatwindow").scrollTop=document.getElementById("chatwindow").scrollHeight;

      })

      socket.on("userlist", (users,activeusers)=>{
        displayUsers(users,activeusers);
      })

      socket.on("recievemessage", (message, name) => {
          displayMessage(message, name);
      });

      socket.on("groupcreated", (groupname) => {
        console.log("created group");
        SetRoom(groupname);
        // navigate("/"+Name+"/"+groupname);
      })
      

      socket.on("badinput",()=>{
        alert("Bad Input");
      })
      socket.on("roomexists",(roomname)=>{
        SetRoom(roomname);
        // navigate("/private/"+Name+"/"+roomname);
      })
      socket.on("emptyroom",()=>{
        alert("Room is Empty");
      })
    })


    // socket.on("callrequest", (data)=>{
    //   setCallerId(data.callerId);
    //   setCallerSignal(data.signal);
    //   setRecievingCall(true);
    // })
    return () => {
      socket.disconnect();
    }

  }, [Room]);

  

  //video calling
  // const calluser= (e) =>{
  //   if(callerId === '')
  //   {
  //     console.log("NO CALLER ID");
  //     return;
  //   }
  //   const peer = new Peer({ initiator: true, trickle: false, stream: Stream })

  //   peer.on("signal", (data)=>{
  //     console.log(Id);
  //     socket.emit("calluser", {UserToCall: callerId, callerId: Id, name: Name});
  //   })

  //   peer.on("stream", (stream)=>{
  //     uservideo.current.srcObject=stream;
  //   })

  //   socket.on("callaccepted", (data)=>{
  //     setCallAccepted(true);
  //   })

  //   // connectionref= peer;
  // }

  // // const acceptCall= () =>{
  // //   setCallAccepted(true);
    

  // //   peer.on("signal", (data)=>{
  // //     socket.emit("acceptcall", {userToCall: callerId, callerId: socket.id, signalData: data.signalData, name: Name});
  // //   })

  // // }

  // const LeaveCall= () =>{
  //   setcallended(false);
  //   connectionref.current.destroy();
  // }



  return (
    <div id="container" className="container-fluid">
    
    <div className="row chat-head" >
        <div className="col-md-2 text-left">
            <img src={Logo} className="img-fluid/ fdlogo"/>
        </div>
        <div className="col-md-4 text-center">
            <div className="search">
                <div className="search_head">
                    <input type="text" placeholder="Search your contact.." name="search"/>
                    <button className="searc"type="submit"><i className="fa fa-search"></i></button>

                </div>
            </div>
        </div>
        <div className="col-md-6 text-right user-info">
          <div className="use">
          <a href=""><span class="username"><h4>{Name}</h4></span></a>
          <a href=""><img src={Avatar1} alt="Avtar" class="avatar userimg"/></a>
          <div class="dropdown-content">
            <Link to="/">
              <a class="log-btn" href="#">Logout </a>
            </Link>

              </div>
            
          </div>
            
             
      </div>
    </div>

    <div className="row" id="ui" > 
      {/* <div className="navmenu">
        <a href="">
        <div className="vert-menu userprofile">
        <i className="fa fa-user-o" aria-hidden="true"></i>
        Profile
        </div>
        </a>  
        
        <a href="">
        <div className=" vert-menu userseting">
        <i className="fa fa-cog" aria-hidden="true"></i>
        Setting
        </div>
        </a>
        
        <a href="">
        <div className=" vert-menu userseting">
        <i className="fa fa-address-card" aria-hidden="true"></i>
        Contact
        </div>
        </a> 
        
        
        <a href="">
        <div className=" vert-menu userseting">
        <i className="fa fa-weixin" aria-hidden="true"></i>
        Chat
        </div>
        </a>
      </div> */}
  
  <div className="side-panel">
      <div className="wrapper d.none" >
        {/* <ul className="nav nav-pills topnav">
          <li className="nav-item">
            <a className="nav-link active" data-toggle="pill" href="#home">Chats<sup  className="sup1">3</sup></a>
          </li>
          <li className="nav-item">
            <a className="nav-link" data-toggle="pill" href="#menu1">Groups</a>
          </li>
        </ul> */}
        
        {/* <div className="tab-content"> */}
          {/* <div className="tab-pane container active" id="home"> */}
            <div className="chat-bg" id="userwindow">
              <ScrollToBottom className="chatwindow"/>
            </div>
          {/* </div> */}
          
          {/* <div className="tab-pane container fade" id="menu1">
            <div className="chat-bg">
            <button className="newgrp"> <i className="fa fa-plus" aria-hidden="true"></i><span className="pl-2">Create New Group</span></button>
        
              <div className="user1 " id="addDomId"  name="addDom" >
                <img src={Avatar1} className="avtar" />
               <h5>Web</h5> <sup className="sup1">2</sup>
               </div>
               
               <div className="user1"  name="addDom">
               <img src={Avatar1} className="avtar" />
               <h5>Projects</h5> <sup className="sup1">5</sup>
               <div className="onlineicon"></div>
               </div>
               
               <div className="user1" name="addDom">
               <img src={Avatar1} className="avtar" />
               <h5>CS</h5> <sup className="sup1">1</sup>
               <div className="onlineicon"></div>
               </div>
               
               <div className="user1" name="addDom">
               <img src={Avatar1} className="avtar" name="addDom"/>
               <h5>Development</h5> 
               </div>
               
               <div className="user1" name="addDom">
               <img src={Avatar1} className="avtar" />
               <h5>Official</h5> 
               </div>
               
               
               
               </div>
              </div> */}

          

        
          {/* <div id="card1" className="card chat_window">
            <h5 className="card-header">Mohini Koli</h5>
            <div className="card-body">
            
            
            </div>
            <div className="card-footer text-muted">
            <input type="text" id="fname" className="msg" name="fname"/>
            <a href="#" className="btn btn-primary">Send</a>
            </div>
          </div>  */}

      {/* </div> */}
      </div>

      {/* <div className="user-profile" >
        <div className="user-wrapper"/>
        <div className="user_nd">
        <img src={Avatar} className="user" id=""/>
        
        <h2 >
        Rohit Shinde
        </h2>
        
        <h4>
        Web Designer
        </h4>
        </div>
        
        <div className="pt-5 contact-info">
        <span className="contact-font">Contact Info</span><br/>
        9876543210<br/>
        rohit.shinde@24framesdigital.com<br/>
        Mumbai<br/>
        </div>
        
      </div> */}
      </div>
      
        <div id="chatwindow"/>
    <div id="pls" ><textarea class="typemsg" id="texter" rows="3" onChange={(e)=>{setMessage(e.target.value)}}> </textarea></div>
    <button id="sender" type="submit" onClick={SendMessage}><AiOutlineSend/></button>
        
    
      

      
    </div>

</div>
    
    );
  }
  
  export default App;