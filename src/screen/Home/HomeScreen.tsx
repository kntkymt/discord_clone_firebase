/** @jsx jsx */
import { jsx, css} from '@emotion/core';
import React, { FunctionComponent, useState } from 'react';
import { Grid, Button, Box } from '@material-ui/core';
import { Text } from '../../component/Text';
import Firebase from '../../application/Firebase';
import { User } from '../../model/User';
import { useDocumentDelete } from '../../hooks/useDocumentDelete';
import { useHistory } from 'react-router';
import { UserInformationBox } from './UserInfomationBox';
import { useMe } from '../../hooks/useMe';
import { AlertModal } from '../../component/AlertModal';
import { Helmet } from 'react-helmet';

export const HomeScreen: FunctionComponent = () => {
  const firestore = Firebase.firestore();
  const deleter = useDocumentDelete<User>(firestore, "versions/1/users");
  const history = useHistory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const me = useMe();

  const logout = async () => {
    if (Firebase.auth()?.currentUser?.uid) {
      const id = Firebase.auth()?.currentUser!.uid;
      await deleter.delete(id);
      await Firebase.auth().signOut();
      history.push("/login");
    }
  };

  if (me.loading) {
    return <Box css={styles.root} />;
  }

  return (
    <Box css={styles.root}>
      <Helmet>
        <title>discord clone</title>
      </Helmet>
      <Grid css={styles.content} container item direction={'column'} spacing={4}>
        <Grid style={{maxWidth: 600}} item>
          <Text color={'#FFFFFF'} fontSize={18} fontWeight={'600'} css={styles.userInfoTitle}>ユーザー情報</Text>
          <UserInformationBox user={me.item} />
        </Grid>
        <Grid item>
          <Button
            style={{backgroundColor: "#FF453A", fontWeight: 'bold'}}
            variant="contained"
            color="secondary"
            onClick={() => setIsModalOpen(true)}>
            ログアウト
          </Button>
        </Grid>
      </Grid>
      <AlertModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onDone={() => logout().catch(error => console.error(error))}/>
    </Box>
  );
};

const styles = {
  root: css`
    width: 100%;
    background-color: #2E3137;
  `,
  content: css`
    padding: 64px 32px;
  `,
  userInfoTitle: css`
    margin-bottom: 24px;
  `
};
