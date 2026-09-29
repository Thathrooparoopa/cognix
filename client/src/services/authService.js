const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const request = async (endpoint, options = {}) => {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      credentials: "include",
      ...options,
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || "Something went wrong."
    );
  }

  return data;
};

export const registerUser = async ({
  name,
  email,
  password,
  avatar,
}) => {
  return request("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      password,
      avatar,
    }),
  });
};

export const loginUser = async ({
  email,
  password,
}) => {
  return request("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });
};

export const getCurrentUser = async () => {
  return request("/api/auth/me", {
    method: "GET",
  });
};

export const updateUserAvatar = async (avatar) => {
  return request("/api/auth/avatar", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      avatar,
    }),
  });
};

export const logoutUser = async () => {
  return request("/api/auth/logout", {
    method: "POST",
  });
};
