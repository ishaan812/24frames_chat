import React,{useEffect, useState, useRef} from "react";
import {io} from "socket.io-client";
import Peer from "simple-peer";
import Editor from "./editor";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams
} from "react-router-dom";

var socket;
function App() {
  const [Id, setId] = useState("");
  const [Stream, setStream] = useState();
  const [recievingCall, setRecievingCall] = useState(false);
  const [callerId, setCallerId] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const Name= useParams().name;
  const [CallAccepted, setCallAccepted] = useState("");
  const [callended, setcallended] = useState("");
  const [Message, setMessage] = useState();
  const [Room, setRoom] = useState("");
  const [sendername,Setsendername] = useState("");
  const [userid,Setuserid] = useState("");


  // const myvideo= useRef(null);
  // const uservideo= useRef(null);
  // const connectionref = useRef(null);

  const displayMessage=(message,name)=>{
    const messagebox= document.createElement("div");
    messagebox.innerHTML= "<div><strong>"+name+"</strong>:"+message+"</div>";
    document.getElementById("chatwindow").appendChild(messagebox);
  }

  const displayId=(Id)=>{
    const idbox= document.createElement("div");
    idbox.innerHTML="<p>"+Name+": "+Id+"</p>";
    document.getElementById("id").appendChild(idbox);
  }

  const MessageChild =(e)=>{
    setMessage(e);
  }

  const SendMessage = (e) => {
    if(Message == undefined ){
      JoinRoom(Room);
    }
    else{
      displayMessage(Message, Name);
      socket.emit("sendmessage", Message, Room, Name);
    }
  }
  
  const JoinRoom = () => {
    console.log("Joining room");
    socket.emit("joinroom", Room);
    displayMessage("You have joined the room "+  Room); 
  }

  useEffect(() => {
    console.log(Name);
    socket= io(process.env.REACT_APP_LINK);
    setId(socket.id);
    // navigator.mediaDevices.getUserMedia({video: true, audio: true}).then((stream)=>{
    //   setStream(stream);
      // myvideo.current.srcObject=stream;
    // });
    socket.on('connect', ()=>{
      displayId(socket.id);


      socket.emit("sendusername", Name);
      socket.emit("getpreviousmessages", "general");
      
      
      socket.on("previousmessages", (data) =>{
        data.forEach(element => {
            displayMessage(element.Message, element.Name);
          }
        );
      })

      socket.on("recievemessage", (message, name) => {
        console.log(message);
        displayMessage(message, name);
      });
      
      socket.on("userid", (data) => {
        console.log(data);
        Setuserid(data);
      });
    })


    socket.on("callrequest", (data)=>{
      setCallerId(data.callerId);
      setCallerSignal(data.signal);
      setRecievingCall(true);
    })

  }, []);

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
      
      <div className="flex-wrap align-items-center">
        <h2>Room:</h2>
        <input type="text" id="Room" onChange={(e)=>{setRoom(e.target.value)}} className="bg-gray-50 border mb-10 border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Room" required/>
      </div> 
      
      <div id="id"></div>
      
      <button onClick={(e)=>{SendMessage(e)}} type="button" className=" w-full text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-16 py-2.5 text-center mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Submit</button>
      
      <div id="chatwindow" className="border border-red-200"></div> 
      <br/>

      {/* <input name="id to call" onChange={(e)=>{setCallerId(e.target.value);console.log(callerId)}} placeholder="id to call"></input><br/>
      <button onClick={(e)=>{calluser(e)}}>Call User</button><br/> */}

      {/* <video ref={myvideo} autoPlay muted style={{width: "300px"}} />
      <video ref={uservideo} playsInline autoPlay style={{width: "300px"}} /> */}


      
      <div id="chatwindow" className="px-10">
      </div>
      
    </div>
  );
}

export default App;
