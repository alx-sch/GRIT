import { redirect } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export async function logoutPageLoader() {
  toast.success('You are logged out', {});
  useAuthStore.getState().logout();
  return redirect('/');
}

export const LogoutPage = () => {
  return null;
};
