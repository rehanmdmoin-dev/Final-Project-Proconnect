"use client";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";
import api, { errText, markSessionActive, markSessionEnded } from "@/api/axios";
import { ep } from "@/api/endpoints";

export type Role = "jobseeker" | "recruiter" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  headline?: string;
  profileImage?: string;
  company?: string | null;
  isVerified?: boolean;
}

interface S { loading: boolean; booting: boolean; user: AuthUser | null; }
const initialState: S = { loading: false, booting: true, user: null };

export const register = createAsyncThunk("auth/register",
  async (p: { name: string; email: string; password: string; role: Role }, { rejectWithValue }) => {
    try { return (await api.post(ep.auth.register, p)).data; }
    catch (e) { return rejectWithValue(errText(e, "Could not create your account")); }
  });

export const verifyEmail = createAsyncThunk("auth/verifyEmail",
  async (p: { email: string; code: string }, { rejectWithValue }) => {
    try { return (await api.post(ep.auth.verifyEmail, p)).data; }
    catch (e) { return rejectWithValue(errText(e, "Could not verify your email")); }
  });

export const resendVerification = createAsyncThunk("auth/resendVerification",
  async (p: { email: string }, { rejectWithValue }) => {
    try { return (await api.post(ep.auth.resendVerification, p)).data; }
    catch (e) { return rejectWithValue(errText(e, "Could not send a new verification code")); }
  });

export const login = createAsyncThunk("auth/login",
  async (p: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(ep.auth.login, p);
      markSessionActive();
      return data;
    }
    catch (e) { return rejectWithValue(errText(e, "Email or password is incorrect")); }
  });

export const loadMe = createAsyncThunk("auth/me", async (_, { rejectWithValue }) => {
  try { return (await api.get(ep.auth.me)).data; }
  catch (e) { return rejectWithValue(errText(e, "Session expired")); }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  markSessionEnded();
  try { await api.post(ep.auth.logout); } catch { /* clear locally regardless */ }
});

export const forgotPassword = createAsyncThunk("auth/forgot",
  async (p: { email: string }, { rejectWithValue }) => {
    try { return (await api.post(ep.auth.forgot, p)).data; }
    catch (e) { return rejectWithValue(errText(e, "Could not send the reset link")); }
  });

export const resetPassword = createAsyncThunk("auth/reset",
  async (p: { token: string; password: string }, { rejectWithValue }) => {
    try { return (await api.post(ep.auth.reset, p)).data; }
    catch (e) { return rejectWithValue(errText(e, "Could not reset your password")); }
  });

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: { setUser: (s, a) => { s.user = a.payload; } },
  extraReducers: (b) => {
    b.addCase(register.pending, (s) => { s.loading = true; })
     .addCase(register.fulfilled, (s) => { s.loading = false; toast.success("Verification code sent to your email."); })
     .addCase(register.rejected, (s, a) => { s.loading = false; toast.error(a.payload as string); })

     .addCase(verifyEmail.pending, (s) => { s.loading = true; })
     .addCase(verifyEmail.fulfilled, (s) => { s.loading = false; toast.success("Email verified. Sign in to continue."); })
     .addCase(verifyEmail.rejected, (s, a) => { s.loading = false; toast.error(a.payload as string); })

     .addCase(resendVerification.pending, (s) => { s.loading = true; })
     .addCase(resendVerification.fulfilled, (s, { payload }) => { s.loading = false; toast.success(payload.message); })
     .addCase(resendVerification.rejected, (s, a) => { s.loading = false; toast.error(a.payload as string); })

     .addCase(login.pending, (s) => { s.loading = true; })
     .addCase(login.fulfilled, (s, { payload }) => {
       s.loading = false;
       s.booting = false;
       s.user = payload.data;
       toast.success(`Welcome back, ${payload.data.name.split(" ")[0]}`);
     })
     .addCase(login.rejected, (s, a) => { s.loading = false; toast.error(a.payload as string); })

     .addCase(loadMe.pending, (s) => { s.booting = true; })
     .addCase(loadMe.fulfilled, (s, { payload }) => {
       if (!s.booting) return;
       s.booting = false;
       s.user = payload.data;
     })
     .addCase(loadMe.rejected, (s) => {
       if (!s.booting) return;
       s.booting = false;
       s.user = null;
     })

    .addCase(logout.fulfilled, (s) => { s.booting = false; s.user = null; toast.success("Signed out"); })

     .addCase(forgotPassword.fulfilled, (_, { payload }) => { toast.success(payload.message); })
     .addCase(forgotPassword.rejected, (_, a) => { toast.error(a.payload as string); })
     .addCase(resetPassword.fulfilled, () => { toast.success("Password updated. Sign in with your new password."); })
     .addCase(resetPassword.rejected, (_, a) => { toast.error(a.payload as string); });
  },
});

export const { setUser } = slice.actions;
export default slice.reducer;
