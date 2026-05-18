import React from "react";
import appwriteServices from "../Appwrite/config";
import { Link } from "react-router-dom";
const PostCard = ({ post }) => {
  // console.log("IMAGE URL:", appwriteServices.getFileView(post.featuredImage));
  // console.log(
  //   "IMAGE URL TYPE:",
  //   typeof appwriteServices.getFileView(post.featuredImage),
  // );
  return (
    <Link to={`/post/${post.$id}`}>
      <div className="w-full rounded-xl bg-white shadow-md p-4 cursor-pointer hover:scale-105 transition duration-300">
        <div className="mb-2">
          <p className="text-lg text-black  font-semibold">
            {post.name || "Unknown"}
          </p>
        </div>
        <div className="w-full h-48 overflow-hidden rounded-xl mb-4 sm:h-48 md:h-56">
          <img
            src={
              post?.featuredImage
                ? appwriteServices.getFileView(post.featuredImage)
                : "https://via.placeholder.com/400"
            }
            alt={post.title}
            className=" w-full h-full object-cover object-center "
          />
        </div>

        <h2 className="text-xl font-bold text-black">{post.title}</h2>
        <p className="text-gray-700 mt-2 line-clamp-2">
          {post.content.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ")}
        </p>
      </div>
    </Link>
  );
};
export default PostCard;
