import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../services/api';


export const fetchRecentChats = createAsyncThunk(
    'chat/fetchRecentChats',
    async (_, { getState, rejectWithValue }) => {
        try {
            const response = await API.get('/chat/recent');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);


export const sendMessage = createAsyncThunk(
    'chat/sendMessage',
    async ({ chatId, text }, { rejectWithValue }) => {
        try {
            const response = await API.post('/chat/send', { chatId, text });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);


export const fetchAllUsers = createAsyncThunk(
    'chat/fetchAllUsers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await API.get('/auth/users');
            return response.data.users || response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);


const initialState = {
    recentChats: [],
    currentMessages: [],
    allUsers: [],
    loading: false,
    error: null,
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRecentChats.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchRecentChats.fulfilled, (state, action) => {
                state.loading = false;
                const data = action.payload.data || action.payload;
                state.recentChats = Array.isArray(data) ? data.map(item => ({
                    ...(item.user || {}),
                    id: item.user?._id || item.user?.id,
                    lastMessage: item.lastMessage
                })) : [];
            })

            .addCase(fetchRecentChats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchAllUsers.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchAllUsers.fulfilled, (state, action) => {
                state.loading = false;
                const fetchedUsers = Array.isArray(action.payload) ? action.payload : [];
                state.allUsers = fetchedUsers.map(u => ({
                    ...u,
                    id: u.id || u._id
                }));
            })
            .addCase(fetchAllUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                state.currentMessages.push(action.payload);
            });
    },
});

export const { clearError } = chatSlice.actions;
export default chatSlice.reducer;
