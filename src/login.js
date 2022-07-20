import React,{useState} from 'react'
import {Link} from "react-router-dom";

const Login = () => {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("general");
  const [link, setlink] = useState("");


  

  return (
    <section class="h-screen">
    <div class="px-6 h-full text-gray-800">
    <div
      class="flex xl:justify-center lg:justify-between justify-center items-center flex-wrap h-full g-6"
    >
      <div
        class="grow-0 shrink-1 md:shrink-0 basis-auto xl:w-6/12 lg:w-6/12 md:w-9/12 mb-12 md:mb-0"
      >
        <img
          src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp"
          class="w-full"
          alt="Sample image"
        />
      </div>
      <div class="xl:ml-20 xl:w-5/12 lg:w-5/12 md:w-8/12 mb-12 md:mb-0">
        <form>
            <div class="flex flex-row items-center justify-center lg:justify-start">
                <p class="text-lg mb-0 mr-4">Sign in with</p>
            </div>
            <div class="mb-6">
                <input
                type="text"
                class="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                id="exampleFormControlInput2"
                placeholder="Name"
                onChange={(e)=>{setName(e.target.value)}}
                />
          </div>

          {/* <div class="mb-6">
                <input
                type="text"
                class="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                id="exampleFormControlInput2"
                placeholder="Room"
                onChange={(e)=>{setRoom(e.target.value)}}
                />
          </div> */}

          <div class="text-center lg:text-left">
            <Link to={'/'+room+'/'+name}>
            <button
              type="button"
              class="align-centre inline-block px-7 py-3 bg-blue-600 text-white font-medium text-sm leading-snug uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">
              Login
            </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  </div>
    </section>
  )
}

export default Login