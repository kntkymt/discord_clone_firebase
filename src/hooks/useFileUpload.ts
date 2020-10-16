import firebase from 'firebase/app';
import { v4 as uuidv4 } from 'uuid';
import { rejects } from 'assert';

export const useFileUpload = (
  storage: firebase.storage.Storage,
  directoryPath: string
) => {

  const upload = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const id = uuidv4();
      const uploader = storage.ref(directoryPath).child(id).put(file);
      const complete = () => {
        storage.ref(directoryPath).child(id).getDownloadURL()
          .then(url => resolve(url));
      };
      const onError = (error: Error) => {
        reject(error);
      };

      uploader.on(firebase.storage.TaskEvent.STATE_CHANGED, complete, onError);
    });
  };

  return {
    upload
  };
};
