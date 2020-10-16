/** @jsx jsx */
import { jsx, css} from '@emotion/core';
import React, { FunctionComponent, useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { Box, Grid, TextField, makeStyles, Theme, createStyles, IconButton } from '@material-ui/core';
import { Helmet } from 'react-helmet';
import { Text } from '../../component/Text';
import firebase from 'firebase';
import Firebase from '../../application/Firebase';
import { Message } from '../../model/Message';
import { useDocumentCreate } from '../../hooks/useDocumentCreate';
import { useDocumentGet } from '../../hooks/useDocumentGet';
import { useCollectionListen } from '../../hooks/useCollectionListen';
import { Channel } from '../../model/Channel';
import { useParams } from 'react-router';
import { useMe } from '../../hooks/useMe';
import { useWindowDimensions } from '../../hooks/useWindowDimensions';
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import { useFileUpload } from '../../hooks/useFileUpload';


const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    input: {
      color: "#FFFFFF",
    },
    root: {
      borderStyle: 'hidden',
      borderColor: '#40444C'
    }
  }),
);

export const ChannelScreen: FunctionComponent = () => {
  const firestore = Firebase.firestore();
  const { channelId } = useParams();
  const creater = useDocumentCreate<Message>(firestore, "versions/1/messages");
  const messages = useCollectionListen<Message>(firestore, (firestore) => firestore.collection("versions/1/messages").where("channelId", "==", channelId));
  const me = useMe();
  const uploader = useFileUpload(Firebase.storage(), "userFiles");
  const channel = useDocumentGet<Channel>(firestore, "versions/1/channels");
  const { width, height } = useWindowDimensions();

  const [text, setText] = useState("");

  useEffect(() => {
    const unsubscribe = messages.subscribe();
    channel.load(channelId);

    return unsubscribe;
  }, []);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
  };

  const submit = () => {
    if (text.length === 0 || channel.item == null) { return; }

    const message: Message = {
      id: '',
      content: text,
      user: me.item!,
      channelId: channel.item.id,
      reactions: [],
      createTime: firebase.firestore.Timestamp.now(),
      updateTime: firebase.firestore.Timestamp.now()
    };

    creater.create(message);

    setText("");
  };

  const onSelectedFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) { return; }
    const file = event.target.files.item(0)!;
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
            user: me.item!,
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
  };

  const classes = useStyles();

  if (channel.loading) {
    return <Box css={styles.root} />;
  }

  return (
    <Grid css={styles.root} container direction={'column'}>
      <Helmet>
        <title>{channel.item?.name ? `#${channel.item.name}` : "discord clone"}</title>
      </Helmet>
      <Grid css={styles.header} container item direction={'row'} alignItems={'center'}>
        <Text css={styles.sharp} color={'#909498'} fontSize={24} fontWeight={'600'}>#</Text>
        <Text color={'#FFFFFF'} fontSize={15} fontWeight={'600'}>{channel.item?.name}</Text>
      </Grid>
      <MessageList
        css={css`width: 100%; height: ${height - 50 - 80}px;`}
        messages={messages.items} />
      <Grid css={styles.input} style={{width: width - 240 - 240 - 70 - 32 - 16}} container direction={'row'} alignItems={'center'}>
        <input id="contained-button-file" css={css`display: none;`} type={'file'} onChange={event => onSelectedFile(event)} />
        <label htmlFor="contained-button-file">
          <ControlPointIcon style={{color: '#B9BBBE', padding: 2}}/>
        </label>
        <TextField
          css={styles.textField}
          style={{marginLeft: 8, width: width - 240 - 240 - 70 - 44 - 32 - 32}}
          placeholder={'メッセージを送信'}
          variant={'outlined'}
          size={'small'}
          value={text}
          inputProps={{className: classes.input, classes: {root: classes.root}}}
          onChange={onChange}
          onKeyDown={event => event.keyCode === 13 ? submit() : {}} />
      </Grid>
    </Grid>
  );
};

const styles = {
  root: css`
    width: 100%;
    height: 100vh;
    background-color: #35393F;
  `,
  header: css`
    width: 100%;
    height: 50px;
    background-color: #37393E;
    border-bottom: solid medium #2D3034;
    position: top;
  `,
  sharp: css`
    margin-left: 16px;
    margin-right: 6px;
  `,
  content: css`
    width: 100%;
  `,
  input: css`
    margin: 0px 16px;
    padding: 2px 8px;
    border-radius: 8px;
    background-color: #40444C;
  `,
  textField: css`
    border-style: hidden;
    font-weight: '600';
    background-color: #40444C;
  `
};
