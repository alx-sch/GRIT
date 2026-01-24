import { Outlet } from 'react-router-dom';
import { redirect } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { useCurrentUserStore } from '@/store/currentUserStore';

export async function protectedLayoutLoader() {
  // Check for token. If no token exists redirect
  if (!useAuthStore.getState().token) {
    throw redirect('/login?forbidden=true');
  }

  // Also validate token in backend and update currentUserStore
  try {
    const user = await authService.me();
    useCurrentUserStore.getState().setUser(user);
    return null;
  } catch (err) {
    throw redirect('/login?forbidden=true');
  }
}

export const ProtectedLayout = () => {
  return (
    <>
      <Outlet />
    </>
  );
};
