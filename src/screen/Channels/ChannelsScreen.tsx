/** @jsx jsx */
import { jsx, css} from '@emotion/core';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { ChannelScreen } from '../Channel/ChannelScreen';
import { Grid, Box } from '@material-ui/core';
import { Text } from '../../component/Text';
import { useCollectionGet } from '../../hooks/useCollectionGet';
import Firebase from '../../application/Firebase';
import { Channel } from '../../model/Channel';
import { ChannelList } from './ChannelList';
import { useDocumentGet } from '../../hooks/useDocumentGet';
import { Switch, Route, useHistory, useParams, useLocation } from 'react-router';
import { Server } from '../../model/Server';
import '../../extensions/arrayExtension';
import { useWindowDimensions } from '../../hooks/useWindowDimensions';
import { MyInformationBox } from './MyInfomationBox';
import { UserList } from './UserList';
import { User } from '../../model/User';
import { useCollectionListen } from '../../hooks/useCollectionListen';


export const ChannelsScreen: FunctionComponent = () => {
  const firestore = Firebase.firestore();
  const { serverId } = useParams();
  const channels = useCollectionGet<Channel>(firestore, (firestore) => firestore.collection("versions/1/channels").where("serverId", "==", serverId));
  const server = useDocumentGet<Server>(firestore, "versions/1/servers");
  const history = useHistory();
  const location = useLocation();
  const users = useCollectionListen<User>(firestore, (firestore) => firestore.collection("versions/1/users"));
  const [selectedItemId, setSelectedItemId] = useState("");
  const { height } = useWindowDimensions();

  useEffect(() => {
    channels.refresh();
    server.load(serverId);
    const unsubscribe = users.subscribe();

    return unsubscribe;
  }, []);

  useEffect(() => {
    // サーバー切り替え or リロードの時に選択チャンネルを復帰する
    if (selectedItemId) { return; }

    // usePrams()ではRouteされてるコンポーネントからしかparamを取れないのでlocationを使う
    const channelId = location.pathname.split("/").get(2);

    if (channelId) {
      // URLから復帰時
      setSelectedItemId(channelId);
    } else {
      // どこのチャンネルも指定していなかった場合、一番上のチャンネルを選択する
      const channelId = channels.items.first()?.id;
      if (!channelId) { return; }

      setSelectedItemId(channelId);
      history.push(`${serverId}/${channelId}`);
    }
  }, [location.pathname, channels.items]);

  const handleListItemClick = (id: string) => {
      if (!id) { return; }
      setSelectedItemId(id);
      history.push(`/${serverId}/${id}`);
    };

  // 簡易LoadingView
  if (channels.refreshing) {
    return <Box css={styles.root} />;
  }

  return (
    <Grid css={styles.root} container direction={'row'}>
      <Grid css={styles.root} container item sm direction={'row'}>
        <Box css={styles.side}>
          <Box>
            <Grid css={styles.header}>
              <Text css={styles.serverName} color={'#FFFFFF'} fontSize={16} fontWeight={'700'}>{server.item?.name}</Text>
            </Grid>
            <Text css={styles.channelName} color={'#909498'} fontSize={13} fontWeight={'600'}>チャンネル</Text>
            <ChannelList
              css={css`width: 240px; height: ${height - 50 - 31 - 24 - 24 - 24}px;`}
              channels={channels.items}
              itemSelected={(channel) => channel.id === selectedItemId}
              itemOnClick={(event, channel) => handleListItemClick(channel.id)} />
          </Box>
          <MyInformationBox />
        </Box>
        <Grid item sm>
          <Switch>
            <Route
              path={`/:serverId/:channelId`}
              render={() => <ChannelScreen key={selectedItemId}/>}/>
          </Switch>
        </Grid>
        <Box css={styles.right.users}>
          <Box css={styles.right.header} />
          <Text css={styles.right.userLabel} color={'#909498'} fontSize={13} fontWeight={'600'}>ユーザー</Text>
          <UserList users={users.items} />
        </Box>
      </Grid>
    </Grid>
  );
};

const styles = {
  root: css`
    width: 100vw;
    background-color: #2E3137;
  `,
  header: css`
    width: 100%;
    height: 31px;
    background-color: #2E3137;
    border-bottom: solid medium #25272A;
  `,
  serverName: css`
    margin: 16px;
  `,
  channelName: css`
    margin: 24px 16px 0px 16px;
  `,
  channelList: css`
    width: 240px;
  `,
  side: css`
    width: 240px;
    height: 100%;
  `,
  right: {
    root: css`
      width: 100vw;
      background-color: #2E3137;
    `,
    header: css`
      width: 100%;
      height: 46px;
      background-color: #37393E;
      border-bottom: solid medium #25272A;
      position: top;
    `,
    userLabel: css`
      margin: 24px 16px 0px 16px;
    `,
    users: css`
      width: 240px;
      height: 100%;
    `
  }
};
