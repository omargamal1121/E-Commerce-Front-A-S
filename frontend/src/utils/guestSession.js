const GUEST_TOKEN_KEY = 'guest_token';

export const getGuestToken = () => {
  return localStorage.getItem(GUEST_TOKEN_KEY);
};

export const saveGuestToken = (token) => {
  if (!token) return;
  localStorage.setItem(GUEST_TOKEN_KEY, token);
};

export const removeGuestToken = () => {
  // Never remove guest token: keep it saved permanently as requested
};

export const clearAllGuestData = () => {
  // Never remove guest token: keep it saved permanently
  localStorage.removeItem('cartItems');
  localStorage.removeItem('pendingGuestOrderNumber');
};
