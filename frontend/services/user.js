import axios from "axios";
import createApiInstance from "./interceptors";

const userApi = createApiInstance("/api/users");

export const editName = async (data) => {
  try {
    const response = await userApi.post("/edit_name", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const get2faQrCode = async () => {
  return userApi
    .get("/2fa_qr_code")
    .then((res) => res.data)
    .catch((err) => {});
};

export const enable2fa = async (data) => {
  return userApi
    .post("/enable_2fa", data)
    .then((res) => res.data)
    .catch((err) => {});
};

export const disable2fa = async (data) => {
  return userApi
    .post("/disable_2fa", data)
    .then((res) => res.data)
    .catch((err) => {});
};

export const is2faEnabled = async () => {
  return userApi
    .get("/is_2fa_enabled")
    .then((res) => res.data)
    .catch((err) => {});
};

export const getCurrentUserInfo = async () => {
  return userApi
    .get("/get_current_user_info")
    .then((res) => res.data)
    .catch((err) => {});
};

export const editPassword = async (data) => {
  try {
    const response = await userApi.post("/edit_password", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const isOauth = async () => {
  return userApi
    .get("/is_oauth")
    .then((res) => res.data)
    .catch((err) => {});
};

export const getUsers = async (data) => {
  return userApi
    .get("/get_users", {
      params: {
        limit: 10,
        ...data,
      },
    })
    .then((res) => res.data)
    .catch((err) => {});
};

export const getUserInfo = async (username) => {
  return userApi
    .get("/get_user_info", {
      params: {
        username: username,
      },
    })
    .then((res) => res.data)
    .catch((err) => {});
};

export const checkSession = async () => {
  return userApi
    .get("/check_session")
    .then((res) => res.data)
    .catch((err) => {});
};

const refreshTokens = async () => {
  try {
    await axios.post("/api/users/refresh");
  } catch {}
};

export const liveGames = async () => {
  return axios
    .get("/api/pong/live_games/", {
      withCredentials: true,
    })
    .then((res) => res.data)
    .catch((err) => {
      if (err?.response?.status === 401) {
        return refreshTokens().then(() => {
          const config = err.config;
          return axios(config);
        });
      }
    });
};

export const addFriend = async (data) => {
  return userApi
    .post("/add_friend", data)
    .then((res) => res.data)
    .catch((err) => {});
};

export const fetchNotifications = async () => {
  return userApi
    .get("/fetch_notifications")
    .then((res) => res.data)
    .catch((err) => {});
};

export const acceptFriendRequest = async (data) => {
  return userApi
    .post("/accept_friend_request", data)
    .then((res) => res.data)
    .catch((err) => {});
};

export const declineFriendRequest = async (data) => {
  return userApi
    .post("/decline_friend_request", data)
    .then((res) => res.data)
    .catch((err) => {});
};

export const send_game_invite = async (data) => {
  return userApi
    .post("/send_game_invite", data)
    .then((res) => res.data)
    .catch((err) => {
      throw new Error(err.response.data.message);
    });
};

export const accept_game_invite = async (data) => {
  return userApi
    .post("/accept_game_invite", data)
    .then((res) => res.data)
    .catch((err) => {});
};

export const decline_game_invite = async (data) => {
  return userApi
    .post("/decline_game_invite", data)
    .then((res) => res.data)
    .catch((err) => {
      throw new Error(err.response.data.message);
    });
};

export const get_friends = async () => {
  return userApi
    .get("/friends")
    .then((res) => res.data)
    .catch((err) => {
      throw new Error(err.response.data.message);
    });
};

export const accept_final_game_invite = async (data) => {
  return userApi
    .post("/accept_final_game_invite", data)
    .then((res) => res.data)
    .catch((err) => {
      throw new Error(err.response.data.message);
    });
};

export const is_friend = async (data) => {
  return userApi
    .get("/is_friend", {
      params: data,
    })
    .then((res) => res.data)
    .catch((err) => {
      throw new Error(err.response.data.message);
    });
};

export const delete_account = async () => {
  return userApi
    .post("/delete_account")
    .then((res) => res.data)
    .catch((err) => {
      throw new Error(err.response.data.message);
    });
};

export const upload_avatar = async (data) => {
  return userApi
    .post("/upload_avatar", data)
    .then((res) => res.data)
    .catch((err) => {
      throw new Error(err.response.data.message);
    });
};

export const edit_nickname = async (data) => {
  return userApi
    .post("/edit_nickname", data)
    .then((res) => res.data)
    .catch((err) => {
      throw new Error(err.response.data.message);
    });
};

export const get_nickname = async () => {
  return userApi
    .get("/get_nickname")
    .then((res) => res.data)
    .catch((err) => {
      throw new Error(err.response.data.message);
    });
};

export const getIsOnline = async (username) => {
  return userApi
    .get("/is_online", {
      params: {
        username,
      },
    })
    .then((res) => res.data);
};

export const getLeaderboard = async () => {
  return userApi
    .get("/players_leaderboard")
    .then((res) => res.data)
    .catch((err) => {
      throw new Error(err.response.data.message);
    });
};
