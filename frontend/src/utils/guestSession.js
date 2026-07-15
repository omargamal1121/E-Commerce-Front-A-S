const GUEST_TOKEN_KEY = 'guest_token';

export const getGuestToken = () => {
  const token = localStorage.getItem(GUEST_TOKEN_KEY);
  console.log("[guestSession] getGuestToken:", token ? "Token found" : "No token found", token);
  return token;
};

export const saveGuestToken = (token) => {
  if (!token) {
    console.warn("[guestSession] Attempted to save empty token");
    return;
  }
  console.log("[guestSession] Saving guest token:", token);
  localStorage.setItem(GUEST_TOKEN_KEY, token);
  console.log("[guestSession] Token saved to localStorage with key:", GUEST_TOKEN_KEY);
};

export const removeGuestToken = () => {
  console.log("[guestSession] Removing guest token");
  localStorage.removeItem(GUEST_TOKEN_KEY);
};

export const clearAllGuestData = () => {
  console.log("[guestSession] Clearing all guest data from localStorage");
  localStorage.removeItem(GUEST_TOKEN_KEY);
  localStorage.removeItem('cartItems');
  localStorage.removeItem('pendingGuestOrderNumber');
  console.log("[guestSession] All guest data cleared");
};
