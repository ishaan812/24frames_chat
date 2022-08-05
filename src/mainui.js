import React,{useEffect, useState, useRef} from "react";
import io from 'socket.io-client'
import Peer from "simple-peer";
import Editor from "./editor";
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Link,
  useParams,
  useNavigate
} from "react-router-dom";
import { data } from "autoprefixer";

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
  const Room = "general";
  const [otherusername, Setotherusername] = useState("");
  const [groupname,Setgroupname]= useState("");
  const navigate =useNavigate();



  const myvideo= useRef(null);
  // const uservideo= useRef(null);
  // const connectionref = useRef(null);

  const displayMessage=(message,name)=>{
    const messagebox= document.createElement("div");
    messagebox.innerHTML= "<div><strong>"+name+"</strong>:"+message+"</div>";
    document.getElementById("chatwindow").appendChild(messagebox);
  }
  
  const displayUsers=(users)=>{
    let userwindow=document.getElementById("userwindow")
    userwindow.innerHTML="";
    let set1= new Set(users);
    set1.forEach(element => {
      const userbox= document.createElement("div");
      userbox.innerHTML= "<button id="+element+" style='border-radius: 4px; background-color: #008CBA; margin-top: 10px; font-size: 30px;'>"+element+"</button>";
      userwindow.appendChild(userbox);
    })
  }

  const displayRooms=(room)=>{
    const roombox= document.createElement("div");
    roombox.innerHTML= "<button style='border-radius: 4px; background-color: #008CBA; margin-top: 10px; font-size: 20px;'>"+room+"</button>";
    document.getElementById("roomwindow").appendChild(roombox);
  }

  const displayId=(Id)=>{
    let idwindow=document.getElementById("id")
    idwindow.innerHTML="";
    const idbox= document.createElement("div");
    idbox.innerHTML="<p>"+Name+": "+Id+"</p>";
    document.getElementById("id").appendChild(idbox);
  }

  const MessageChild =(e)=>{
    setMessage(e);
  }

  const SendMessage = (e) => {
    if(Message == undefined ){
      alert("Please enter a message");
    }
    else{
      console.log("hello");
      displayMessage(Message, Name);
      socket.emit("sendmessage", Message, Room, Name);
    }
  }

  const RedirecttoRoom = (e) => {
      socket.emit("createprivateroom", Name, otherusername);
  }

  const RedirecttoGroup = (e) => {
    socket.emit("creategrouproom",groupname, Name);
  }

  useEffect(() => {
    socket= io("localhost:3000",{
      transports: ['websocket'],
    });
    setId(socket.id);
    navigator.mediaDevices.getUserMedia({video: true, audio: true}).then((stream)=>{
      setStream(stream);
      myvideo.current.srcObject=stream;
    });
    socket.on('connect', ()=>{
      displayId(socket.id);

      socket.emit("sendusername", Name);
      socket.emit("getpreviousmessages", Room);
      socket.emit("getuserlist", Room);
      document.getElementById('roomwindow').innerHTML="";
      socket.emit("getroomlist", Name);

      socket.on("roomlist", (roomlist)=>{
        let roomnames=[];
        roomlist.forEach(room=>{roomnames.push(room.RoomName)});
        var set= new Set(roomnames);
        set.forEach(room=>{displayRooms(room)});
      })

      socket.on("privateroomrequest", (roomname)=>{
        socket.emit("joinprivateroom", roomname);
      })

      socket.on("roomcreated", (roomname)=>{
        console.log("created room");
        // navigate("/private/"+Name+"/"+roomname);
        Room = roomname;
      })

      socket.on("previousmessages", (data) =>{
        document.getElementById('chatwindow').innerHTML="";
        data.forEach(element => {
            displayMessage(element.Message, element.Name);
          }
        );
      })

      socket.on("activeuserlist", (userlist)=>{
        displayUsers(userlist);
      })

      socket.on("recievemessage", (message, name) => {
        console.log(message);
        displayMessage(message, name);
      });

      socket.on("groupcreated", (groupname) => {
        console.log("created group");
        navigate("/"+Name+"/"+groupname);
      })
      

      socket.on("badinput",()=>{
        alert("Bad Input");
      })
      socket.on("roomexists",(roomname)=>{
        navigate("/private/"+Name+"/"+roomname);
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
    <div className="App">

      <Editor SetMessage={MessageChild}/>  
      
      <div className="grid grid-cols-2">
        <div>
          <div className="flex-wrap align-items-center">
            <br/>
            <h2>Create/Join Private Room:</h2>
            <input type="text" id="otherusername" onChange={(e)=>{Setotherusername(e.target.value)}} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 w-1/3" placeholder="other username" required/>
          </div>
          <button onClick={(e)=>{RedirecttoRoom(e)}} type="button" className="w-2/3 text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-16 py-2.5 text-center mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Create Private Room</button> 
        </div>
        <div>
          <div className="flex-wrap align-items-center">
            <br/>
            <h2>Create Group:</h2>
            <input type="text" id="groupname" onChange={(e)=>{Setgroupname(e.target.value)}} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 w-1/3" placeholder="group name" required/>
          </div>
          <button onClick={(e)=>{RedirecttoGroup(e)}} type="button" className="w-2/3 text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-16 py-2.5 text-center mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Create Group</button> 
        </div>
      </div>

      <div id="id"></div>
      
      <button onClick={(e)=>{SendMessage(e)}} type="button" className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-16 py-2.5 text-center mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Submit</button>
      
      <br/>

      {/* <input name="id to call" onChange={(e)=>{setCallerId(e.target.value);console.log(callerId)}} placeholder="id to call"></input><br/>
      <button onClick={(e)=>{calluser(e)}}>Call User</button><br/> */}

      <video ref={myvideo} autoPlay muted style={{width: "300px"}} />
      <video ref={uservideo} playsInline autoPlay style={{width: "300px"}} /> 


      <div className="grid grid-cols-3 gap-2">
        <div id="chatbox" className="w-1/3">
          <h1 className="text-5xl overflow-y-hidden">Chat:</h1>
          <div id="chatwindow" ></div>
        </div>
        <div id="users">
          <h1 className="text-5xl overflow-y-hidden">Active Users:</h1>
          <div id="userwindow" className="w-1/3"></div>
        </div>
        <div id="rooms">
          <h1 className="text-5xl overflow-y-hidden">Rooms:</h1>
          <div id="roomwindow" className="w-1/3"></div>
        </div>
      </div>
       
    </div>
    
  );
}

export default App;