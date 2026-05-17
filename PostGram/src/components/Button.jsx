import React from 'react'

const Button = ({
    children,
    type = 'button',
    bgcolor = 'bg-blue-500',
    textcolor = 'text-white',
    className = '',
    ...props
}

) => {
  return (
    <button className={`px-4 py-2 rounded-lg cursor-pointer ${bgcolor} ${textcolor} ${className}`} {...props} type={type}>
        {children}
    </button>
  )
}

export default Button