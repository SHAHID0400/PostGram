import conf from "../conf/confi";
import { Client, Account , ID } from "appwrite";

export class AuthService {
    client=new Client();
    account;

    constructor(){
        this.client
        .setEndpoint(conf.appwriteUrl)
        .setProject(conf.appwriteProjectId);
        this.account = new Account(this.client);
    }

    async CreateAccount({email,password,name}){
        try {
            const userAccount = await this.account.create( ID.unique(),email,password,name);
            if(userAccount){
                // call another method
                return this.Login({email,password});
                
            }else{
                return userAccount;
            }
            
        } catch (error) {
            throw error;
        }
    }

     async Login({email,password}){
        try {
             return await this.account.createEmailPasswordSession(email, password);
        } catch (error) {
            throw error;
        }

}
     async getcurrentUser(){
        try {
            return await this.account.get();
        } catch (error) {
            if(error.code === 401){
                // user not logged in
                return null;
            }
            // console.log("Appwrite service :: getcurrentUser :: error",error);
            // return null;
        }
        return null;
     }
        async Logout(){
            try {
                await this.account.deleteSessions();
            } catch (error) {
                console.log("Appwrite service :: Logout :: error",error);
            }
        }
}


 const authservice = new AuthService();

 export default authservice;
