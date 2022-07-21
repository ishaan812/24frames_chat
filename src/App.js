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


const App = () => {
  return (
    <div>
        <Navbar/>
        <Router>
            <Routes>
                <Route path="/:name/:room" exact element={<Main/>} />
                <Route path="/" element={<Login/>} />
            </Routes>
        </Router>
    </div>
  )
}

export default App