import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const preparedToasts = [
  {
    param: 'logged_out',
    type: 'success',
    message: 'You are logged out',
    description: '',
  },
  {
    param: 'logged_in',
    type: 'success',
    message: 'You are logged in',
    description: '',
  },
  {
    param: 'forbidden',
    type: 'error',
    message: 'You need to login first',
    description: '',
  },
  {
    param: 'signup_success',
    type: 'success',
    message: 'Account created',
    description: 'You can now log in',
  },
] as const;

export function useRouteToasts() {
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    // Get a copy of original params and track if we change it with a flag
    const processedParams = new URLSearchParams(params);
    let changed = false;

    preparedToasts.forEach((el) => {
      if (params.has(el.param)) {
        const { type, message, description } = el;
        toast[type](message, { description });
        processedParams.delete(el.param);
        changed = true;
      }
    });
    if (changed) setParams(processedParams, { replace: true }); // Replace params so we don't run this again
  }, [params, setParams]);
}
