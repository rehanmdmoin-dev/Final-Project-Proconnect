"use client";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";
import api, { errText } from "@/api/axios";
import { ep } from "@/api/endpoints";

export type Stage = "Applied" | "Under Review" | "Shortlisted" | "Interview" | "Selected" | "Rejected" | "Withdrawn";

export interface Application {
  _id: string;
  status: Stage;
  coverLetter?: string;
  createdAt: string;
  job: { _id: string; title: string; location?: string; workMode?: string; jobType?: string };
  company: { _id: string; name: string; logo?: string };
  candidate?: any;
  statusHistory?: Array<{ status: Stage; changedAt: string; note?: string }>;
}

interface S {
  loading: boolean; items: Application[]; current: Application | null;
  stats: { total: number; byStatus: Record<string, number> } | null;
  applicants: any[]; total: number; totalPages: number;
}
const initialState: S = { loading: false, items: [], current: null, stats: null, applicants: [], total: 0, totalPages: 1 };

export const fetchMyApplications = createAsyncThunk("app/mine",
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try { return (await api.get(ep.applications.mine, { params })).data; }
    catch (e) { return rejectWithValue(errText(e, "Could not load your applications")); }
  });

export const fetchStats = createAsyncThunk("app/stats", async (_, { rejectWithValue }) => {
  try { return (await api.get(ep.applications.stats)).data; }
  catch (e) { return rejectWithValue(errText(e, "Could not load statistics")); }
});

export const fetchApplicants = createAsyncThunk("app/applicants",
  async ({ jobId, params }: { jobId: string; params?: Record<string, any> }, { rejectWithValue }) => {
    try { return (await api.get(ep.jobs.applicants(jobId), { params })).data; }
    catch (e) { return rejectWithValue(errText(e, "Could not load applicants")); }
  });

export const updateApplicationStatus = createAsyncThunk("app/status",
  async ({ id, status, note }: { id: string; status: Stage; note?: string }, { rejectWithValue }) => {
    try { return (await api.patch(ep.applications.status(id), { status, note })).data; }
    catch (e) { return rejectWithValue(errText(e, "Could not update the application")); }
  });

export const withdrawApplication = createAsyncThunk("app/withdraw",
  async (id: string, { rejectWithValue }) => {
    try { await api.patch(ep.applications.withdraw(id)); return id; }
    catch (e) { return rejectWithValue(errText(e, "Could not withdraw this application")); }
  });

const slice = createSlice({
  name: "application",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchMyApplications.pending, (s) => { s.loading = true; })
     .addCase(fetchMyApplications.fulfilled, (s, { payload }) => {
       s.loading = false; s.items = payload.data || []; s.total = payload.total; s.totalPages = payload.totalPages;
     })
     .addCase(fetchMyApplications.rejected, (s, a) => { s.loading = false; toast.error(a.payload as string); })

     .addCase(fetchStats.fulfilled, (s, { payload }) => { s.stats = payload.data; })

     .addCase(fetchApplicants.pending, (s) => { s.loading = true; })
     .addCase(fetchApplicants.fulfilled, (s, { payload }) => {
       s.loading = false; s.applicants = payload.data || []; s.total = payload.total;
     })
     .addCase(fetchApplicants.rejected, (s, a) => { s.loading = false; toast.error(a.payload as string); })

     .addCase(updateApplicationStatus.fulfilled, (s, { payload }) => {
       const updated = payload.data;
       s.applicants = s.applicants.map((a) => (a._id === updated._id ? { ...a, status: updated.status } : a));
       toast.success(`Moved to ${updated.status}`);
     })
     .addCase(updateApplicationStatus.rejected, (_, a) => { toast.error(a.payload as string); })

     .addCase(withdrawApplication.fulfilled, (s, { payload }) => {
       s.items = s.items.map((i) => (i._id === payload ? { ...i, status: "Withdrawn" as Stage } : i));
       toast.success("Application withdrawn");
     })
     .addCase(withdrawApplication.rejected, (_, a) => { toast.error(a.payload as string); });
  },
});

export default slice.reducer;
