import axios from "axios";

export const oauth = async (code, state) => {
  try {
    const response = await axios.post("/api/users/oauth", {
      code,
      state,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const signup = async (data) => {
  try {
    const response = await axios.post("/api/users/signup", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const login = async (data) => {
  try {
    const response = await axios.post("/api/users/login", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verify_otp = async (data) => {
  try {
    const response = await axios.post("/api/users/verify_otp", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const log_out = async () => {
  try {
    const response = await axios.post("/api/users/logout");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const can_access_2fa = async (data) => {
  try {
    const response = await axios.get("/api/users/can_access_2fa", {
      params: data,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
