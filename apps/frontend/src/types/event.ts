export interface Event {
  id: number;
  authorId: number;
  author: string;
  content: string|null;
  createdAt: string;
  endAt: string|null;
  isPublished: boolean;
  isPublic: boolean;
  startAt: string|null;
  title: string;
  /* extra fields?
  interestedCounts: number;
  interestedFriends: string[];
  imageURL: string|null;
  location: string|null; */
}
