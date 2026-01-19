import { redirect } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function logoutPageLoader() {
  useAuthStore.getState().clearAuthenticated();
  return redirect('/?logged_out=true');
}

export const LogoutPage = () => {
  return null;
};
