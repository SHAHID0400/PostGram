import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    status: false,
    userData: null,
    isAdmin: false,
};
const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        login: (state, action) => {
            state.status = true;
            state.userData = {
                ...action.payload,
                labels: Array.isArray(action.payload?.labels) ? action.payload.labels : [],
            };
            state.isAdmin = state.userData.labels.includes("admin");
        },

        logout: (state) => {
            state.status = false;
            state.userData = null;
            state.isAdmin = false;
        },

        updateUser: (state, action) => {
            if (!state.userData) return;
            state.userData = { ...state.userData, ...action.payload };
            if (Array.isArray(action.payload?.labels)) {
                state.isAdmin = action.payload.labels.includes("admin");
            }
        }


    },
});
 export const {logout,login,updateUser} =authSlice.actions
export default authSlice.reducer;
