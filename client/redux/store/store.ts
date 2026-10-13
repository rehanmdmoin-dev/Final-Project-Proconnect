import { configureStore } from "@reduxjs/toolkit";
import auth from "../slice/authSlice";
import job from "../slice/jobSlice";
import application from "../slice/applicationSlice";
import social from "../slice/socialSlice";

export const store = configureStore({
  reducer: { auth, job, application, social },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
