import axios from "axios";

export const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export const api = axios.create({ baseURL, withCredentials: true });

// Access tokens are short-lived (15m). On a 401 we transparently rotate once
// and replay the original request, so the user never sees a random logout.
let refreshing = false;
let sessionEnded = false;
let waiters: Array<() => void> = [];

export const markSessionEnded = () => { sessionEnded = true; };
export const markSessionActive = () => { sessionEnded = false; };

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthCall = /\/auth\/(login|register|verify-email|resend-verification|refresh-token|logout|forgot-password|reset-password|change-password)(?:$|\?)/.test(original?.url || "");

    if (status === 401 && !original._retry && !isAuthCall && !sessionEnded) {
      original._retry = true;

      if (refreshing) {
        return new Promise((resolve) => {
          waiters.push(() => resolve(api(original)));
        });
      }

      refreshing = true;
      try {
        await axios.post(
          `${baseURL}/auth/refresh-token`,
          undefined,
          { withCredentials: true }
        );
        waiters.forEach((retry) => retry());
        waiters = [];
        return api(original);
      } catch (e) {
        waiters = [];
        if (typeof window !== "undefined") {
          const path = window.location.pathname;
          const authPath = ["/login", "/register", "/forgot-password", "/verify-email", "/reset-password"]
            .some((route) => path === route || path.startsWith(`${route}/`));

          if (path !== "/" && !authPath) {
            const loginUrl = new URL("/login", window.location.origin);
            loginUrl.searchParams.set("next", `${path}${window.location.search}`);
            window.location.assign(loginUrl);
          }
        }
        return Promise.reject(e);
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const errText = (e: any, fallback: string) =>
  e?.response?.data?.message || fallback;

export default api;
