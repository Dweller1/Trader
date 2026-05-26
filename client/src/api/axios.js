import axios from "axios";

let _token = null;
export const setToken = (t) => {
  _token = t;
};
export const getToken = () => _token;

const api = axios.create({ baseURL: "/api", withCredentials: true });

api.interceptors.request.use((config) => {
  if (_token) config.headers.Authorization = `Bearer ${_token}`;
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = axios
          .post("/api/auth/refresh", {}, { withCredentials: true })
          .then((r) => {
            _token = r.data.accessToken;
            return _token;
          })
          .catch(() => {
            _token = null;
            localStorage.removeItem("vatAuth");
            localStorage.removeItem("vatUser");
            window.location.href = "/login";
            return Promise.reject(err);
          })
          .finally(() => {
            refreshPromise = null;
          });
      }
      const token = await refreshPromise;
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    }
    return Promise.reject(err);
  },
);

export default api;
