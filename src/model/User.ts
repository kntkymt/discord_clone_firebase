import { firestore } from 'firebase/app';

export interface User {
  id: string;
  name: string;
  imageUrl: string;
  createTime: firestore.Timestamp;
  updateTime: firestore.Timestamp;
};
