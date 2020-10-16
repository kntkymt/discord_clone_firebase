/** @jsx jsx */
import { jsx, css} from '@emotion/core';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router';
import { useAuthState } from '../../hooks/useAuthState';
import Firebase from '../../application/Firebase';
import firebase from 'firebase';
import { ServersScreen } from '../Servers/ServersScreen';
import { useDropzone } from 'react-dropzone';
import { Fade, Backdrop, Modal, Grid } from '@material-ui/core';
import { useFileUpload } from '../../hooks/useFileUpload';
import { Text } from '../../component/Text';
import { useDocumentCreate } from '../../hooks/useDocumentCreate';
import { Message } from '../../model/Message';
import { useDocumentGet } from '../../hooks/useDocumentGet';
import { User } from '../../model/User';

export const MainScreen: FunctionComponent = () => {
  const history = useHistory();
  const location = useLocation();
  const authState = useAuthState(Firebase.auth());
  const uploader = useFileUpload(Firebase.storage(), "userFiles");
  const creater = useDocumentCreate(Firebase.firestore(), "versions/1/messages");
  const getter = useDocumentGet<User>(Firebase.firestore(), "versions/1/users");
  const [channelId, setChannelId] = useState("");
  const [isFileDraging, setIsFileDraging] = useState(false);

  // authStateを使っているからか(?) useMeが効かないため、普通にgetする
  useEffect(() => {
    if (!Firebase.auth()?.currentUser?.uid) { return; }
    getter.load(Firebase.auth()?.currentUser!.uid);
  }, [Firebase.auth()?.currentUser?.uid, authState.isAuthenticated]);

  useEffect(() => {
    if (!authState.refreshing && !authState.isAuthenticated) {
      history.push("/login");
    }
  }, [authState, history]);

  useEffect(() => {
    // usePrams()ではRouteされてるコンポーネントからしかparamを取れないのでlocationを使う
    const channelId = location.pathname.split("/").get(2);
    if (!channelId) { return; }
    setChannelId(channelId);
  }, [location.pathname]);

  const onDrop = ((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file: File) => {
      const reader = new FileReader();

      reader.onabort = () => console.log('file reading was aborted');
      reader.onerror = () => console.log('file reading has failed');
      reader.onload = () => {
        // ファイルサイズが10MB以上だったらエラー
        if (file.size > 10_000_000) {
          return;
        }

        uploader.upload(file)
          .then(url => {
            // ファイル付きメッセージを送信
            const message: Message = {
              id: '',
              content: '',
              file: {
                name: file.name,
                url: url,
                size: file.size,
                type: file.type
              },
              user: getter.item!,
              channelId: channelId,
              reactions: [],
              createTime: firebase.firestore.Timestamp.now(),
              updateTime: firebase.firestore.Timestamp.now()
            };
            creater.create(message);
          })
          .catch(error => console.error(error));
      };
      reader.readAsArrayBuffer(file);
    });
  });

  const onDragEnter = () => setIsFileDraging(true);
  const onDragLeave = () => setIsFileDraging(false);
  const onDropAccepted = () => setIsFileDraging(false);
  const onDropRejected = () => setIsFileDraging(false);

  // モーダルDropZoneのドラッグ判定を出すために使うトリガー用のDropZone
  const triger = useDropzone({onDragEnter, noClick: true, noKeyboard: true});
  // 実際にファイルを処理するDropZone
  const { getRootProps } = useDropzone({onDrop, onDragEnter, onDragLeave, onDropAccepted, onDropRejected, noClick: true, noKeyboard: true});

  return (
    <div {...triger.getRootProps()}>
      <ServersScreen />
      <Modal
        // モーダルにドラッグの判定を与える
        {...getRootProps()}
        style={{display:'flex',alignItems:'center',justifyContent:'center'}}
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={isFileDraging}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}>
        <Fade in={isFileDraging}>
          <Grid container style={{width: 340}} css={styles.modalContent} alignItems={'center'} justify={'center'}>
            <Grid container style={{width: 320}} css={styles.modalDot} alignItems={'center'} justify={'center'} >
              <Text css={styles.modalTitle} color={"#FFFFFF"} fontSize={24} fontWeight={"700"}>ドラッグ&ドロップ</Text>
            </Grid>
          </Grid>
        </Fade>
      </Modal>
    </div>
  );
};

const styles = {
  modalContent: css`
    outline: none;
    width: 340px;
    height: 200px;
    background-color: #7388DA;
    border-radius: 8px;
  `,
  modalDot: css`
    border: dashed;
    border-color: #FFFFFF;
    border-width: 1px;
    width: 320px;
    height: 180px;
    border-radius: 8px;
  `,
  modalTitle: css`
    text-align: center;
  `,
};
