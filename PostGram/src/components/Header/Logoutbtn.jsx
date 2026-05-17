import React from 'react'
import { useDispatch } from 'react-redux';
import authService from '../../Appwrite/Auth';
import { logout } from '../../store/authSlice';
const Logoutbtn = () => {
    const dispatch = useDispatch();
    const logoutHandler = () => {
        authService.Logout()
        .then(() => {
            dispatch(logout());
        });
    }
   return (

      <button 
      className='inline-block px-6 py-2 duration-200 hover:bg-blue-100 hover:text-black rounded-full'
      onClick={logoutHandler}>Logout</button>
    
  )
}

export default Logoutbtn;