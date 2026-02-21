import { ResLocationBase } from '@grit/schema';
export type {
  ResLocationBase as LocationBase,
  ResLocationGetAll as LocationResponse,
} from '@grit/schema';

export type LocationSummary = Omit<ResLocationBase, 'events'>;
