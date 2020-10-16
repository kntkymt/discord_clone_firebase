import { User } from "./User";

export interface ReactionEntity {
  showPriority: number;
  emojiId: string;
  user: User;
};

export interface ReactionValue {
  showPriority: number;
  emojiId: string;
  users: User[];
}
