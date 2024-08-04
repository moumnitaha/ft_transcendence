import axios from "axios";

const refreshTokens = async () => {
  try {
    await axios.post("/api/users/refresh");
  } catch {}
};

const createApiInstance = (baseURL) => {
  const api = axios.create({
    baseURL: baseURL,
  });

  api.interceptors.response.use(
    function (response) {
      return response;
    },
    function (error) {
      if (error?.response?.status === 401) {
        return refreshTokens().then(() => {
          const config = error.config;
          return axios(config);
        });
      }
      return Promise.reject(error);
    }
  );

  return api;
};

export default createApiInstance;
