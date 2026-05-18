import React from "react";
import appwriteServices from "../Appwrite/config";
import { Link } from "react-router-dom";
const PostCard = ({ post }) => {
  console.log("IMAGE URL:", appwriteServices.getFileView(post.featuredImage));
  console.log(
    "IMAGE URL TYPE:",
    typeof appwriteServices.getFileView(post.featuredImage),
  );
  return (
    <Link to={`/post/${post.$id}`}>
      <div className="w-full rounded-xl bg-gray-100 p-4 cursor-pointer sm:p-5 hover:scale-105 transition">
        <div className="w-full justify-center mb-4">
          <img
            src={
              post?.featuredImage
                ? appwriteServices.getFileView(post.featuredImage)
                : "https://via.placeholder.com/400"
            }
            alt={post.title}
            className="rounded-xl w-full h-48 object-cover sm:h-48"
          />
        </div>

        <h2 className="text-xl font-bold text-black">{post.title}</h2>
        <div
          className="text-gray-700 mt-2"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </Link>
  );
};
export default PostCard;
