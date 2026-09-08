

const TOKEN_KEY = 'token';
const REDIRECT_KEY = 'post_login_redirect';

export const auth = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },

  getAuthHeader(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  redirectToLogin(): void {
    if (typeof window === 'undefined') return;
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register') {
      sessionStorage.setItem(REDIRECT_KEY, currentPath);
    }
    window.location.href = '/login';
  },

  getAndClearPostLoginRedirect(): string | null {
    if (typeof window === 'undefined') return null;
    const path = sessionStorage.getItem(REDIRECT_KEY);
    sessionStorage.removeItem(REDIRECT_KEY);
    return path;
  },
};
