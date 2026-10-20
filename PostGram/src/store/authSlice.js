import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    status: false,
     userData: null,
};
const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        login: (state, action) => {
            state.status = true;
            state.userData = action.payload;
        },

        logout: (state) => {
            state.status = false;
            state.userData = null;
        },

        updateUser: (state, action) => {
            if (!state.userData) return;
            state.userData = { ...state.userData, ...action.payload };
        }


    },
});
 export const {logout,login,updateUser} =authSlice.actions
export default authSlice.reducer;
