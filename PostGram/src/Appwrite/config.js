import conf from "../conf/confi";
import { Client, Account , ID ,Databases ,Storage ,Query } from "appwrite";


export class Service {
    client=new Client();
    Databases;
    bucket;
    
    constructor(){
        this.client 
        .setEndpoint(conf.appwriteUrl)
        .setProject(conf.appwriteProjectId);
        this.Databases = new Databases(this.client);
        this.bucket = new Storage(this.client);

    }
    async createPost({title,slug,content,featuredImage,status,userId}){
        try {
           return await this.Databases.createDocument(
            conf.appwriteDatabaseId,
            conf.appwriteCollectionId,
             ID.unique(),
            {
                title,
                content,
                featuredImage,
                status,
                userId,
                slug,
            }
           ); 
        } catch (error) {
            console.log("Appwrite services :: createPost :: error",error);

            
            
        }

}

   async updatePost( slug,{title,content,featuredImage,status}){
    try {
        return await this.Databases.updateDocument(
            conf.appwriteDatabaseId,
            conf.appwriteCollectionId,
            slug,{
                title,
                content,
                featuredImage,
                status,
            }
        );
    } catch (error) {
        console.log("Appwrite services :: updatePost :: error",error);
    }

}

async deletePost(slug){
    try {
        await this.Databases.deleteDocument(
            conf.appwriteDatabaseId,
            conf.appwriteCollectionId,
            slug,
        );
        return true;
    } catch (error) {
        console.log("Appwrite services :: deletePost :: error",error);
        return false;
    }
}

async getPost(slug){
    try {
        return await this.Databases.getDocument(
            conf.appwriteDatabaseId,
            conf.appwriteCollectionId,
            slug,
        )
    } catch (error) {
        console.log("Appwrite services :: getPosts :: error",error);
        return false;
    }

}

async getPosts(queries=[Query.equal("status","active")]){
    try {
        return await this.Databases.listDocuments(
            conf.appwriteDatabaseId,
            conf.appwriteCollectionId,
            queries,
        );
    } catch (error) {
        console.log("Appwrite services :: getPosts :: error",error);
        return false;
    }
}

//file upload
async uploadFile(file){

    try {
        return await this.bucket.createFile(
            conf.appwriteBucketId,
            ID.unique(),
            file,
        );
    } catch (error) {
        console.log("Appwrite services :: uploadFile :: error",error);
        return false;
    }
}

async deletFile(fileId){
    try {
        await this.bucket.deleteFile(
            conf.appwriteBucketId,
            fileId
        );
        return true;
    } catch (error) {
        console.log("Appwrite services :: deletFile :: error",error);
        return false;
    }
}

 getFileView(fileId){
    return this.bucket.getFileView(
        conf.appwriteBucketId,
        fileId
    )

}

}
const service = new Service();

 
export default service;