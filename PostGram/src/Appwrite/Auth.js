import conf from "../conf/confi";
import { sanitizeText, sanitizeUsername } from "../lib/security";
import { Client, Account , ID } from "appwrite";

const SESSION_STORAGE_PREFIXES = ["a_session_", "postgram:"];
const PENDING_PROFILE_KEY = "pg_pending_profile";
const PENDING_PROFILE_TTL = 24 * 60 * 60 * 1000;

/**
 * Removes any client-side session artefacts owned by Appwrite or PostGram.
 * Appwrite cookies live on the API domain and are cleared by deleteSession().
 */
const purgeClientSessionStorage = () => {
    if (typeof window === "undefined") return;

    [window.localStorage, window.sessionStorage].forEach((storage) => {
        try {
            Object.keys(storage)
                .filter((key) =>
                    SESSION_STORAGE_PREFIXES.some((prefix) =>
                        key.startsWith(prefix),
                    ),
                )
                .forEach((key) => storage.removeItem(key));
        } catch (error) {
            // Storage can be blocked in private mode; the Appwrite session
            // itself has already been terminated.
        }
    });
};

export class AuthService {
    client=new Client();
    account;

    constructor(){
        this.client
        .setEndpoint(conf.appwriteUrl)
        .setProject(conf.appwriteProjectId);
        this.account = new Account(this.client);
    }

    /**
     * Ends the session for this browser only. Other devices stay signed in.
     */
    async clearCurrentSession(){
        try {
            await this.account.deleteSession("current");
        } catch (error) {
            // No active session for this origin — nothing to clear.
        }
    }

    /**
     * Removes cached identity/session data from Web Storage.
     */
    clearClientCache(){
        purgeClientSessionStorage();
    }

    /**
     * Remembers the profile chosen during registration until the first
     * sign-in creates a session. Contains no credentials or session tokens.
     */
    rememberPendingProfile({ email, name, username }){
        if (typeof window === "undefined" || !email) return;

        try {
            window.localStorage.setItem(
                PENDING_PROFILE_KEY,
                JSON.stringify({
                    email: String(email).toLowerCase(),
                    name: sanitizeText(name, 128),
                    username: sanitizeUsername(username),
                    createdAt: Date.now(),
                }),
            );
        } catch (error) {
            // Registration still succeeds when storage is unavailable.
        }
    }

    /**
     * Returns and clears the pending registration profile for this email.
     */
    consumePendingProfile(email){
        if (typeof window === "undefined" || !email) return null;

        try {
            const stored = window.localStorage.getItem(PENDING_PROFILE_KEY);
            if (!stored) return null;

            window.localStorage.removeItem(PENDING_PROFILE_KEY);

            const parsed = JSON.parse(stored);
            const sameEmail =
                parsed?.email === String(email).toLowerCase();
            const fresh = Date.now() - Number(parsed?.createdAt) < PENDING_PROFILE_TTL;

            if (!sameEmail || !fresh) return null;

            return {
                name: sanitizeText(parsed.name, 128),
                username: sanitizeUsername(parsed.username),
            };
        } catch (error) {
            return null;
        }
    }

    async CreateAccount({email,password,name}){
        // Never let a pre-existing session leak into a new registration.
        await this.clearCurrentSession();

        const userAccount = await this.account.create(
            ID.unique(),
            email,
            password,
            sanitizeText(name, 128),
        );

        // No session is created here. The person signs in explicitly on
        // /login, which keeps registration and authentication separate.
        return userAccount;
    }

     async Login({email,password}){
        // Drop any stale session before creating a fresh one so two accounts
        // can never share a browser session.
        await this.clearCurrentSession();

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

     async createJWT(){
        return await this.account.createJWT();
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
                await this.account.deleteSession("current");
            } catch (error) {
                try {
                    await this.account.deleteSessions();
                } catch (fallbackError) {
                    // The local state below is cleared even if the API is down.
                }
            }

            purgeClientSessionStorage();
        }
}


 const authservice = new AuthService();

 export default authservice;
