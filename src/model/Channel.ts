import { firestore } from 'firebase/app';

export interface Channel {
  id: string;
  name: string;
  serverId: string;
  createTime: firestore.Timestamp;
  updateTime: firestore.Timestamp;
};
