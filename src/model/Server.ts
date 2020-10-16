import { firestore } from 'firebase/app';

export interface Server {
  id: string;
  name: string;
  createTime: firestore.Timestamp;
  updateTime: firestore.Timestamp;
};
