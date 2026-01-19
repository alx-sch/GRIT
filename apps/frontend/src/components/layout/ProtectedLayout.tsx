import { Outlet } from 'react-router-dom';
import { redirect } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export function protectedLayoutLoader() {
  // Check for token. If no token exists redirect
  if (!useAuthStore.getState().isLoggedIn) {
    toast.success('You are not allowed to view this resource', {}); // TODO: This does not show because sonner cannot work in loaders without extra state management
    throw redirect('/login');
  }
  // TODO once backend has the option to check for user, make sure token is valid. If not, redirect. Function needs to be async for that since we use await
  // const token = useAuthStore.getState().token;
  // const res = await fetch('http://localhost:3000/api/user/me', {
  //   headers: {
  //     Accept: 'application/json',
  //     Authorization: `Bearer ${token}`,
  //   },
  // });
  // if (!res.ok) {
  //   toast.error('Please log in again', {});
  //   throw redirect('/');
  // }
  // return res.json();
}

export const ProtectedLayout = () => {
  return (
    <>
      <Outlet />
    </>
  );
};
