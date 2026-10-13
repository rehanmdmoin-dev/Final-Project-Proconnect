"use client";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";
import api, { errText } from "@/api/axios";
import { ep } from "@/api/endpoints";

export interface Post {
  _id: string;
  content: string;
  media?: { url?: string; type?: string };
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  createdAt: string;
  author: { _id: string; name: string; headline?: string; profileImage?: string };
  company?: { _id: string; name: string; logo?: string } | null;
}

export interface ConnectionItem {
  connectionId: string;
  status: string;
  isIncoming: boolean;
  user: { _id: string; name: string; headline?: string; profileImage?: string; location?: string };
}

interface S {
  feedLoading: boolean; posts: Post[];
  connections: ConnectionItem[]; pending: any[];
  notifications: any[]; unread: number;
}
const initialState: S = { feedLoading: false, posts: [], connections: [], pending: [], notifications: [], unread: 0 };

export const fetchFeed = createAsyncThunk("social/feed",
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try { return (await api.get(ep.posts.feed, { params })).data; }
    catch (e) { return rejectWithValue(errText(e, "Could not load your feed")); }
  });

export const createPost = createAsyncThunk("social/createPost",
  async (content: string, { rejectWithValue }) => {
    try {
      const fd = new FormData();
      fd.append("content", content);
      return (await api.post(ep.posts.create, fd)).data;
    } catch (e) { return rejectWithValue(errText(e, "Could not publish your post")); }
  });

export const toggleLike = createAsyncThunk("social/like",
  async (id: string, { rejectWithValue }) => {
    try { return { id, ...(await api.post(ep.posts.like(id))).data }; }
    catch (e) { return rejectWithValue(errText(e, "Could not update the like")); }
  });

export const fetchConnections = createAsyncThunk("social/connections",
  async (_, { rejectWithValue }) => {
    try { return (await api.get(ep.connections.list)).data; }
    catch (e) { return rejectWithValue(errText(e, "Could not load your network")); }
  });

export const fetchPendingRequests = createAsyncThunk("social/pending",
  async (_, { rejectWithValue }) => {
    try { return (await api.get(ep.connections.pending)).data; }
    catch (e) { return rejectWithValue(errText(e, "Could not load requests")); }
  });

export const respondToRequest = createAsyncThunk("social/respond",
  async ({ id, accept }: { id: string; accept: boolean }, { rejectWithValue }) => {
    try {
      await api.patch(accept ? ep.connections.accept(id) : ep.connections.reject(id));
      return { id, accept };
    } catch (e) { return rejectWithValue(errText(e, "Could not respond to this request")); }
  });

export const fetchNotifications = createAsyncThunk("social/notifications",
  async (_, { rejectWithValue }) => {
    try { return (await api.get(ep.notifications.list)).data; }
    catch (e) { return rejectWithValue(errText(e, "Could not load notifications")); }
  });

export const fetchUnreadCount = createAsyncThunk("social/unread", async () => {
  try { return (await api.get(ep.notifications.unread)).data; } catch { return { data: { count: 0 } }; }
});

export const markAllRead = createAsyncThunk("social/readAll", async () => {
  await api.patch(ep.notifications.readAll);
});

const slice = createSlice({
  name: "social",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchFeed.pending, (s) => { s.feedLoading = true; })
     .addCase(fetchFeed.fulfilled, (s, { payload }) => { s.feedLoading = false; s.posts = payload.data || []; })
     .addCase(fetchFeed.rejected, (s, a) => { s.feedLoading = false; toast.error(a.payload as string); })

     .addCase(createPost.fulfilled, (s, { payload }) => {
       s.posts.unshift({ ...payload.data, isLiked: false });
       toast.success("Posted");
     })
     .addCase(createPost.rejected, (_, a) => { toast.error(a.payload as string); })

     .addCase(toggleLike.fulfilled, (s, { payload }) => {
       const p = s.posts.find((x) => x._id === payload.id);
       if (p) {
         p.isLiked = payload.data.isLiked;
         p.likeCount += payload.data.isLiked ? 1 : -1;
       }
     })

     .addCase(fetchConnections.fulfilled, (s, { payload }) => { s.connections = payload.data || []; })
     .addCase(fetchPendingRequests.fulfilled, (s, { payload }) => { s.pending = payload.data || []; })
     .addCase(respondToRequest.fulfilled, (s, { payload }) => {
       s.pending = s.pending.filter((p) => p._id !== payload.id);
       toast.success(payload.accept ? "You're now connected" : "Request declined");
     })
     .addCase(respondToRequest.rejected, (_, a) => { toast.error(a.payload as string); })

     .addCase(fetchNotifications.fulfilled, (s, { payload }) => { s.notifications = payload.data || []; })
     .addCase(fetchUnreadCount.fulfilled, (s, { payload }) => { s.unread = payload.data?.count || 0; })
     .addCase(markAllRead.fulfilled, (s) => {
       s.unread = 0;
       s.notifications = s.notifications.map((n) => ({ ...n, isRead: true }));
     });
  },
});

export default slice.reducer;
