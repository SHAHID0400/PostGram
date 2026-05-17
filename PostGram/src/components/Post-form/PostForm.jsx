import React, { useEffect } from "react";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { Button, Input, Select, RTE } from "../index";
import appwriteService from "../../Appwrite/config";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const PostForm = ({ post }) => {
  const { register, handleSubmit, watch, setValue, control, getValues } =
    useForm({
      defaultValues: {
        title: post?.title || "",
        slug: post?.slug || "",
        content: post?.content || "",
        status: post?.status || "active",
      },
    });

  const navigate = useNavigate();
  const userData = useSelector((state) => state.auth?.userData);

  const submit = async (data) => {
    if (post) {
      // ✅ UPDATE POST
      const file = data.image[0]
        ? await appwriteService.uploadFile(data.image[0])
        : null;

      if (file) {
        appwriteService.deletFile(post.featuredImage);
      }

      const dbPost = await appwriteService.updatePost(post.$id, {
        ...data,
        featuredImage: file ? file.$id : undefined,
      });

      if (dbPost) {
        navigate(`/post/${dbPost.$id}`);
      }
    } else {
      // ✅ CREATE NEW POST (YEH MISSING THA)
      const file = await appwriteService.uploadFile(data.image[0]);

      if (file) {
        const dbPost = await appwriteService.createPost({
          ...data,
          featuredImage: file.$id,
          userId: userData?.$id, // 👈 SAFE ACCESS
        });

        if (dbPost) {
          navigate(`/post/${dbPost.$id}`);
        }
      }
    }
  };

  const slugTransform = useCallback((value) => {
    if (value && typeof value === "string")
      return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-");
    return "";
  }, []);

  const title = watch("title");

  useEffect(() => {
    if (title) {
      setValue("slug", slugTransform(title), {
        shouldValidate: true,
      });
    }
  }, [title, slugTransform, setValue]);

  if (!userData) {
    return <h1>Loading...</h1>;
  }

  console.log("FINAL USER ID:", userData?.$id);
  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-wrap">
      <div className="w-2/3 px-2">
        <Input
          label={<span className='text-white'>Title</span> }
          placeholder="Title"
          className="mb-4"
          {...register("title", { required: true })}
          onChange={(e) => {
            const value = e.target.value;

            setValue("title", value);

            setValue("slug", slugTransform(value), {
              shouldValidate: true,
            });
          }}
        />
        <Input
          label={<span className='text-white'>Slug</span>}
          placeholder="Slug"
          className="mb-4"
          {...register("slug", { required: true })}
          onInput={(e) => {
            setValue("slug", slugTransform(e.currentTarget.value), {
              shouldValidate: true,
            });
          }}
        />
        <RTE
          label={<span className='text-white'>Content</span> }
          name="content"
          control={control}
          defaultValue={getValues("content")}
        />
      </div>
      <div className="w-1/3 px-2">
        <Input
          label={<span className='text-white'>Featured Image</span> }
          type="file"
          className="mb-4"
          accept="image/png, image/jpg, image/jpeg, image/gif"
          {...register("image", { required: !post })}
        />
        {post && (
          <div className="w-full mb-4">
            <img
              src={appwriteService.getFileView(post.featuredImage)}
              alt={post.title}
              className="rounded-lg"
            />
          </div>
        )}
        <Select
          options={["active", "inactive"]}
          label={<span className='text-white'>Status</span>}
          className="mb-4"
          {...register("status", { required: true })}
        />
        <Button
          type="submit"
          bgColor={post ? "bg-green-500" : undefined}
          className="w-full"
          
        >
          {post ? "Update" : "Submit"}
        </Button>
      </div>
    </form>
  );
};

export default PostForm;
