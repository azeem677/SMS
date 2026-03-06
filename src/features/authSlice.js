import { createSlice } from '@reduxjs/toolkit';

const safeParse = (key, fallback = null) => {
    const item = localStorage.getItem(key);
    if (!item || item === "undefined") return fallback;
    try {
        return JSON.parse(item);
    } catch (e) {
        console.error(`Error parsing localStorage key "${key}":`, e);
        return fallback;
    }
};

const user = safeParse('user');
const token = localStorage.getItem('token');

const initialState = {
    user: user,
    token: token && token !== "undefined" ? token : null,
    isAuthenticated: !!token && token !== "undefined",
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const { user, token } = action.payload;
            // Map _id to id for MongoDB compatibility
            const normalizedUser = user ? { ...user, id: user.id || user._id } : null;
            state.user = normalizedUser;
            state.token = token;
            state.isAuthenticated = true;
            localStorage.setItem('user', JSON.stringify(normalizedUser));
            localStorage.setItem('token', token);
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
