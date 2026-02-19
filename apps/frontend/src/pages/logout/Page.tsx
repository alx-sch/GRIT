import { redirect } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useCurrentUserStore } from '@/store/currentUserStore';

export function logoutPageLoader() {
  useAuthStore.getState().clearAuthenticated();
  useCurrentUserStore.getState().clearUser();
  return redirect('/?logged_out=true');
}

export const LogoutPage = () => {
  return null;
};
