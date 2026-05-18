import React, { useEffect, useState } from 'react'
import appwriteServices from "../Appwrite/config"
import { PostCard,Container } from '../components'
import { set } from 'react-hook-form'


export const AllPosts = () => {
    const [posts, setposts] = useState([])
    useEffect(() => {
        appwriteServices.getPosts([]).then((posts) => {
            if(posts){
                setposts(posts.documents)
            }

        })
    }, [])
  return (
    <div className=' w-full py-8'>
      <Container>
       <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
        {posts.map((post) => (
            
                <PostCard post={post} className="text-black" />
        ))}

       </div> 
      </Container>
    </div>
  )
}
export default AllPosts;
