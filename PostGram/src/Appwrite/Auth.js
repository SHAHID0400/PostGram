import conf from "../conf/confi";
import { sanitizeText, sanitizeUsername } from "../lib/security";
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
        const userAccount = await this.account.create(
            ID.unique(),
            email,
            password,
            sanitizeText(name, 128),
        );

        if(!userAccount){
            return userAccount;
        }

        return this.Login({email,password});
    }

     async Login({email,password}){
        return this.account.createEmailPasswordSession(email, password);
     }

     async getcurrentUser(){
        try {
            return await this.account.get();
        } catch (error) {
            if(error.code === 401){
                return null;
            }
            throw error;
        }
     }

     async updateName(name){
        return await this.account.updateName(name);
     }

     async getPrefs(){
        return await this.account.getPrefs();
     }

     async updatePrefs(prefs){
        return await this.account.updatePrefs(prefs);
     }

     /**
      * Single source of truth for profile updates.
      * Merges prefs (username, bio, avatarFileId) and updates the account name.
      */
     async saveProfile({ name, username = "", bio = "", avatarFileId = "" }){
        const cleanName = sanitizeText(name, 128);
        const cleanUsername = sanitizeUsername(username);
        const cleanBio = sanitizeText(bio, 160);

        if (cleanName) {
            await this.account.updateName(cleanName);
        }

        const currentPrefs = (await this.account.getPrefs()) || {};
        await this.account.updatePrefs({
            ...currentPrefs,
            username: cleanUsername,
            bio: cleanBio,
            avatarFileId,
        });

        return {
            name: cleanName,
            username: cleanUsername,
            bio: cleanBio,
            avatarFileId,
        };
     }

        async Logout(){
            try {
                await this.account.deleteSessions();
            } catch (error) {
                // The local session is cleared by the caller.
            }
        }
}


 const authservice = new AuthService();

 export default authservice;
