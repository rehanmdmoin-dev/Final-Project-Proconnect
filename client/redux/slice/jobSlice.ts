"use client";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";
import api, { errText } from "@/api/axios";
import { ep } from "@/api/endpoints";

export interface Job {
  _id: string;
  title: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  skills: string[];
  experience?: { min: number; max: number };
  salary?: { min?: number; max?: number; currency?: string; isDisclosed?: boolean };
  location: string;
  workMode: "Remote" | "Hybrid" | "On-site";
  jobType: string;
  deadline?: string;
  status?: string;
  applicationCount?: number;
  createdAt: string;
  isSaved?: boolean;
  company: { _id: string; name: string; logo?: string; industry?: string };
}

interface S {
  loading: boolean; jobs: Job[]; current: Job | null;
  page: number; totalPages: number; total: number;
  saved: Job[]; mine: Job[];
}
const initialState: S = { loading: false, jobs: [], current: null, page: 1, totalPages: 1, total: 0, saved: [], mine: [] };

export const fetchJobs = createAsyncThunk("job/list",
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try { return (await api.get(ep.jobs.list, { params })).data; }
    catch (e) { return rejectWithValue(errText(e, "Could not load jobs")); }
  });

export const fetchJob = createAsyncThunk("job/one",
  async (id: string, { rejectWithValue }) => {
    try { return (await api.get(ep.jobs.byId(id))).data; }
    catch (e) { return rejectWithValue(errText(e, "Could not load this job")); }
  });

export const fetchMyJobs = createAsyncThunk("job/mine",
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try { return (await api.get(ep.jobs.mine, { params })).data; }
    catch (e) { return rejectWithValue(errText(e, "Could not load your jobs")); }
  });

export const fetchSavedJobs = createAsyncThunk("job/saved", async (_, { rejectWithValue }) => {
  try { return (await api.get(ep.users.savedJobs)).data; }
  catch (e) { return rejectWithValue(errText(e, "Could not load saved jobs")); }
});

export const toggleSave = createAsyncThunk("job/toggleSave",
  async ({ id, saved }: { id: string; saved: boolean }, { rejectWithValue }) => {
    try {
      if (saved) await api.delete(ep.jobs.save(id));
      else await api.post(ep.jobs.save(id));
      return { id, saved: !saved };
    } catch (e) { return rejectWithValue(errText(e, "Could not update saved jobs")); }
  });

export const applyToJob = createAsyncThunk("job/apply",
  async ({ id, coverLetter }: { id: string; coverLetter?: string }, { rejectWithValue }) => {
    try { return (await api.post(ep.jobs.apply(id), { coverLetter })).data; }
    catch (e) { return rejectWithValue(errText(e, "Could not submit your application")); }
  });

export const createJob = createAsyncThunk("job/create",
  async (payload: any, { rejectWithValue }) => {
    try { return (await api.post(ep.jobs.list, payload)).data; }
    catch (e) { return rejectWithValue(errText(e, "Could not publish this job")); }
  });

const slice = createSlice({
  name: "job",
  initialState,
  reducers: { clearCurrent: (s) => { s.current = null; } },
  extraReducers: (b) => {
    b.addCase(fetchJobs.pending, (s) => { s.loading = true; })
     .addCase(fetchJobs.fulfilled, (s, { payload }) => {
       s.loading = false; s.jobs = payload.data || [];
       s.page = payload.page; s.totalPages = payload.totalPages; s.total = payload.total;
     })
     .addCase(fetchJobs.rejected, (s, a) => { s.loading = false; toast.error(a.payload as string); })

     .addCase(fetchJob.pending, (s) => { s.loading = true; })
     .addCase(fetchJob.fulfilled, (s, { payload }) => { s.loading = false; s.current = payload.data; })
     .addCase(fetchJob.rejected, (s, a) => { s.loading = false; toast.error(a.payload as string); })

     .addCase(fetchMyJobs.fulfilled, (s, { payload }) => { s.mine = payload.data || []; })
     .addCase(fetchSavedJobs.fulfilled, (s, { payload }) => { s.saved = payload.data || []; })

     .addCase(toggleSave.fulfilled, (s, { payload }) => {
       const j = s.jobs.find((x) => x._id === payload.id);
       if (j) j.isSaved = payload.saved;
       if (s.current?._id === payload.id) s.current.isSaved = payload.saved;
       if (!payload.saved) s.saved = s.saved.filter((x) => x._id !== payload.id);
       toast.success(payload.saved ? "Saved to your list" : "Removed from saved");
     })
     .addCase(toggleSave.rejected, (_, a) => { toast.error(a.payload as string); })

     .addCase(applyToJob.fulfilled, () => { toast.success("Application sent"); })
     .addCase(applyToJob.rejected, (_, a) => { toast.error(a.payload as string); })

     .addCase(createJob.fulfilled, () => { toast.success("Job published"); })
     .addCase(createJob.rejected, (_, a) => { toast.error(a.payload as string); });
  },
});

export const { clearCurrent } = slice.actions;
export default slice.reducer;
