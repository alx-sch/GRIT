/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters */
import { useLoaderData } from 'react-router';

/* wrapper around useLoaderData to provide typed data */
export function useTypedLoaderData<T>(): T {
  const data = useLoaderData() as T;

  return data;
}
