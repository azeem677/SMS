import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchRecentChats = createAsyncThunk(
    'chat/fetchRecentChats',
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch('http://localhost:5000/api/chat/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                return rejectWithValue(errorData.message || 'Failed to fetch recent chats');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const sendMessage = createAsyncThunk(
    'chat/sendMessage',
    async ({ chatId, text }, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch('http://localhost:5000/api/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ chatId, text }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                return rejectWithValue(errorData.message || 'Failed to send message');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchAllUsers = createAsyncThunk(
    'chat/fetchAllUsers',
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const response = await fetch('http://localhost:5000/api/auth/users', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                return rejectWithValue(errorData.message || 'Failed to fetch users');
            }

            const data = await response.json();
            return data.users || data;
        } catch (error) {
            return rejectWithValue(error.message);
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
                state.recentChats = action.payload;
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
                state.allUsers = Array.isArray(action.payload) ? action.payload : [];
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
