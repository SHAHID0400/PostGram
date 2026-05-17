import React, { useEffect, useState } from "react";
import appwriteService from "../Appwrite/config";
import { Container, PostCard } from "../components";
import { set } from "react-hook-form";
import Contentcard from "../components/Contentcard";
import { useSelector } from "react-redux";

const Home = () => {
  const authStatus = useSelector((state) => state.auth.status);
  const [posts, setposts] = useState([]);
  useEffect(() => {
    if (authStatus) {
      appwriteService.getPosts().then((posts) => {
        if (posts) {
          setposts(posts.documents);
        }
      });
    } else {
      setposts([]);
    }
  }, [authStatus]);

  if (posts.length === 0) {
    if (authStatus) {
      return (
        <div className="text-white text-center mt-20">
          <h2 className="text-2xl font-bold">No Posts Yet 😅</h2>
          <p className="text-gray-400 mt-2">
            Start by creating your first post
          </p>
        </div>
      );
    } else {
      return <Contentcard />;
    }
  }
  return (
    <div className="w-full py-8">
      <Container>
        <div className="flex flex-wrap -mx-2 ">
          {posts.map((post) => (
            <div
              className="p-2 w-full sm:w-1/2 md:w-1/3 lg:w-1/4"
              key={post.$id}
            >
              <PostCard post={{ ...post }} />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
};

export default Home;
