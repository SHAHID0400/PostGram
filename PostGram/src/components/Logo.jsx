import React from 'react'
import logo from "../assets/plogo.png";

const Logo = () => {
  return (
    <div>
      <img 
       src={logo}
       alt="Logo"  
      className='rounded-full w-16 h-16 object-contain shadow-lg'/>
    </div>
  )
}

export default Logo