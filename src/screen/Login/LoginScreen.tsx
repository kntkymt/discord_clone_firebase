/** @jsx jsx */
import { jsx, css} from '@emotion/core';
import React, { FunctionComponent, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, Grid, TextField, Button, Paper, makeStyles, Theme, createStyles } from '@material-ui/core';
import { Text } from '../../component/Text';
import { useDocumentCreate } from '../../hooks/useDocumentCreate';
import { User } from '../../model/User';
import Firebase from '../../application/Firebase';
import firebase from 'firebase';
import { useAuthState } from '../../hooks/useAuthState';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    loginButton: {
      backgroundColor: "#7289DA",
      color: "#FFFFFF",
      fontSize: "16px",
      fontWeight: 'bold',
      '&:hover': {
        backgroundColor: "#677BC4"
      }
    },
    input: {
      color: "#FFFFFF"
    }
  }),
);

export const LoginScreen: FunctionComponent = () => {
  const [username, setUsername] = useState("");
  const [isError, setIsError] = useState(false);
  const history = useHistory();
  const creater = useDocumentCreate<User>(Firebase.firestore(), "versions/1/users");
  const authState = useAuthState(Firebase.auth());

  useEffect(() => {
    console.log(authState.isAuthenticated);
    if (!authState.refreshing && authState.isAuthenticated) {
      authState.unsubscribe();
      history.push("/");
    }
  }, [authState, history]);

  const login = () => {
    console.log('login');
    if (username.length === 0) {
      setIsError(true);
      return;
    }

    const create = async () => {
      const firebaseUser = await Firebase.auth().signInAnonymously();

      const user: User = {
        id: firebaseUser.user!.uid,
        name: username,
        imageUrl: "",
        createTime: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
        updateTime: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
      };

      await creater.create(user);
    };

    create().catch(error => console.log(error));
  };

  const classes = useStyles();

  return (
    <Box css={styles.root}>
      <Paper style={{backgroundColor: '#373940'}} css={styles.card} elevation={3}>
        <Grid container direction={'column'} justify={'center'} alignItems={'center'} spacing={3}>
          <Grid item direction={'column'}>
            <Text css={styles.title} color={'#FFFFFF'} fontSize={24} fontWeight={'600'}>{isError ? "ひどい..." : "はじめまして！"}</Text>
            <Text css={styles.subTitle} color={'#BABBBE'} fontSize={16} fontWeight={'600'}>{isError ? "名前すらおしえてくれないんですね..." : "お名前をおしえてください！"}</Text>
          </Grid>
          <Grid container item direction={'column'} justify={'center'} alignItems={'flex-start'}>
            <Text css={styles.username} color={isError ? '#FF4948' : '#8E9298'} fontSize={14} fontWeight={'600'}>ユーザー名</Text>
            <TextField
              error={isError}
              css={styles.usernameField}
              variant={'outlined'}
              size={'small'}
              inputProps={{className: classes.input}}
              onChange={element => setUsername(element.target.value)}/>
          </Grid>
          <Grid container item>
            <Button
              className={classes.loginButton}
              css={styles.loginButton}
              variant={'contained'}
              onClick={() => login()}
            >
              ログイン
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

const styles = {
  root: css`
    width: 100%;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #2F3136;
  `,
  card: css`
    display: inline-block;
    width: 450px;
    border-radius: 4px;
    padding: 32px;
  `,
  title: css`
    text-align: center;
    margin-bottom: 4px;
  `,
  subTitle: css`
    text-align: center;
  `,
  username: css`
    margin-bottom: 8px;
    text-align: start;
  `,
  usernameField: css`
    background-color: #31333A;
    color: #FFFFFF;
    caret-color: #FFFFFF;
    width: 100%;
  `,
  loginButton: css`
    width: 100%;
    height: 44px;
  `
};
