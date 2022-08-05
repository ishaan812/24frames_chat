import React,{useEffect, useState} from 'react'
import {Link} from "react-router-dom";
import './assets/css/style.css'
import Logo from './assets/Images/logo.png';
import pana from './assets/Images/Voice chat-pana.svg';


const Login = () => {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("general");
  const [link, setlink] = useState("");


  

  return (
    <div className="container-fluid bg">
        <div className="row page-bg">
          <div className="col-md-5 bg-blue">
            <img src={Logo} className="img-fluid"/> 
            <img src={pana} className="login_img"/> 
          </div>
          <div className="col-md-7 bg-form">
           <h4>Login</h4>
          
                <div className="form-group">
                    <div className="icon-holder">
                        <label><i className="fa fa-user"></i></label>
                        <input type="text" id="txtName" name="txtName" className="form-control  required"  onChange={(e)=>{setName(e.target.value);console.log(name)}} placeholder="Enter Name*"/>
                    </div>
                    {/* <label id="txtName-error" className="error">Please Enter Name</label> */}
                </div>
          
                {/* <div className="form-group">
                    <div className="icon-holder">
                        <label><i className="fa fa-at"></i></label>
                        <input type="email" id="txtEmail" name="txtEmail" className="form-control  required" placeholder="Enter Email ID*"/>
                    </div>
                    {/* <label id="txtEmail-error" className="error">Please Enter Email ID</label> */}
                {/* </div> */} 
                <Link to={'/'+name}>
                <button className="btn log_btn">Log in</button>
                </Link>
                <h5>Or</h5>
                <button className="gog"><i className="fa fa-google" aria-hidden="true"></i>
                  <span className='googlesign'>Sign in with Google</span></button>
            
        </div>
        </div>
        </div>
  
  )
}

export default Login