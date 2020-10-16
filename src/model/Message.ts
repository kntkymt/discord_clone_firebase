import { firestore } from 'firebase/app';
import { File } from './File';
import { ReactionEntity } from './Reaction';
import { User } from './User';

export interface Message {
  id: string;
  content: string;
  file?: File;
  user: User;
  channelId: string;
  reactions: ReactionEntity[];
  createTime: firestore.Timestamp;
  updateTime: firestore.Timestamp;
};
