const GUEST_TOKEN_KEY = 'guest_token';

export const getGuestToken = () => {
  return localStorage.getItem(GUEST_TOKEN_KEY);
};

export const saveGuestToken = (token) => {
  if (!token) return;
  localStorage.setItem(GUEST_TOKEN_KEY, token);
};

export const removeGuestToken = () => {
  localStorage.removeItem(GUEST_TOKEN_KEY);
};

export const clearAllGuestData = () => {
  localStorage.removeItem(GUEST_TOKEN_KEY);
  localStorage.removeItem('cartItems');
  localStorage.removeItem('pendingGuestOrderNumber');
};
