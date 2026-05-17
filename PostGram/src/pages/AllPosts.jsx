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
       <div className='flex flex-wrap'>
        {posts.map((post) => (
            <div key={post.$id} className='p-2 w-1/4'>
                <PostCard post={post} className="text-black" />

            </div>
        ))}

       </div> 
      </Container>
    </div>
  )
}
export default AllPosts;
