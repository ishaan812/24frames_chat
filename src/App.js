import React from 'react'
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link
  } from "react-router-dom";
  import Main from './mainui';
  import Login from './login';
  import Navbar from './navbar';
  import Uipage from './uipage';


const App = () => {
  return (
    <div>
        {/* <Navbar/> */}
        <Router forceRefresh={true}>
            <Routes>
                {/* <Route path="/:name/:room" exact element={<Main type={"normal"}/>} /> */}
                {/* <Route path="/private/:name/:room" element={<Main type={"private"}/>} />   */}
                <Route path="/" element={<Login/>} />
                <Route path="/:name" element={<Uipage/>} />
                {/* <Route path="/private/:name/:room" element={<Uipage/>} />   */}
            </Routes>
        </Router>
    </div>
  )
}

export default App