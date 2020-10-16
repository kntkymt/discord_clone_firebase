/** @jsx jsx */
import { jsx, css} from '@emotion/core';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { Grid, Button, Avatar, Box, createStyles, makeStyles, Theme, TextField, Badge } from '@material-ui/core';
import { Text } from '../../component/Text';
import Firebase from '../../application/Firebase';
import { User } from '../../model/User';
import ImageIcon from '@material-ui/icons/Image';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useDocumentUpdate } from '../../hooks/useDocumentUpdate';

type Props = {
  user: User | null;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    editButton: {
      backgroundColor: "#7289DA",
      color: "#FFFFFF",
      fontSize: "16px",
      fontWeight: 'bold',
      '&:hover': {
        backgroundColor: "#677BC4"
      }
    },
    doneButton: {
      backgroundColor: "#42B681",
      color: "#FFFFFF",
      fontSize: "16px",
      fontWeight: 'bold',
      '&:hover': {
        backgroundColor: "#3CA474"
      }
    },
    input: {
      color: "#FFFFFF"
    }
  }),
);

export const UserInformationBox: FunctionComponent<Props> = (props) => {
  const storage = Firebase.storage();
  const firestore = Firebase.firestore();

  const fileUploader = useFileUpload(storage, "userIcons");
  const updater = useDocumentUpdate<User>(firestore, "versions/1/users");

  const [isEditing, setIsEditing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [username, setUsername] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const classes = useStyles();

  // propsの最初はundefinedの可能性があるため、後から更新する
  useEffect(() => {
    if (!props.user?.name) { return; }
    setUsername(props.user.name);
  }, [props.user?.name]);

  useEffect(() => {
    if (!props.user?.imageUrl) { return; }
    setImageUrl(props.user.imageUrl);
  }, [props.user?.imageUrl]);

  const onSelectedImage: (event: React.ChangeEvent<HTMLInputElement>) => void = (event) => {
    if (!event.target.files) { return; }
    const image = event.target.files.item(0)!;
    fileUploader.upload(image)
      .then(url => setImageUrl(url))
      .catch(error => console.error(error));
  };

  const cancelEdit: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void = () => {
    setUsername(props.user!.name);
    setImageUrl(props.user!.imageUrl);
    setIsEditing(false);
    setIsError(false);
  };

  const doneEdit: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void = () => {
    if (!username) {
      setIsError(true);
      return;
    }
    setIsError(false);

    const user: User = {
      id: props.user!.id,
      name: username,
      imageUrl: imageUrl,
      createTime: props.user!.createTime,
      updateTime: props.user!.updateTime
    };

    updater.update(user)
      .then(() => setIsEditing(false))
      .catch(error => console.error(error));
  };

  return (
    <Grid css={styles.root} container direction={'column'}>
      <Grid css={styles.content} container item alignItems={'center'} spacing={4}>
        {!isEditing || <input id="contained-button-file" css={css`display: none;`} accept="image/*" multiple type={'file'} onChange={onSelectedImage} />}
        <label htmlFor="contained-button-file">
          <Badge
            overlap="circle"
            invisible={!isEditing}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            badgeContent={<ImageIcon style={{width: 28, height: 28, borderRadius: 18, padding: 4, backgroundColor: '#DCDDDE'}} color='action' />}>
            <Avatar style={{width: 100, height: 100}} src={imageUrl} />
          </Badge>
        </label>
        <Grid item sm={7}>
          <Text color={'#7B7D81'} fontSize={14} fontWeight={'600'}>ユーザー名</Text>
          {isEditing ?
            <TextField
              error={isError}
              css={styles.usernameField}
              autoFocus
              variant={'outlined'}
              size={'small'}
              defaultValue={username}
              inputProps={{className: classes.input}}
              onChange={element => setUsername(element.target.value)}/> :
            <Text color={'#FFFFFF'} fontSize={16} fontWeight={'600'}>{username}</Text>
          }
        </Grid>
        {isEditing ||
          <Button
            className={classes.editButton}
            onClick={() => setIsEditing(!isEditing)}>
              編集
          </Button>
        }
      </Grid>
      {isEditing &&
        <Grid style={{paddingRight: 16, marginBottom: 16}} container item justify={'flex-end'} spacing={1}>
          <Grid item>
            <Button
              style={{color: '#FFFFFF'}}
              onClick={cancelEdit}>
                キャンセル
            </Button>
          </Grid>
          <Grid item>
            <Button
              className={classes.doneButton}
              onClick={doneEdit}>
                保存
            </Button>
          </Grid>
        </Grid>
      }
    </Grid>
  );
};

const styles = {
  root: css`
    border-radius: 8px;
    background-color: #292B2F;
    width: 300px;
  `,
  content: css`
    padding: 40px;
  `,
  usernameField: css`
    background-color: #31333A;
    color: #FFFFFF;
    caret-color: #FFFFFF;
    width: 100%;
  `,
};
