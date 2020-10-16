/** @jsx jsx */
import { jsx, css} from '@emotion/core';
import React, { FunctionComponent, useEffect, useState} from 'react';
import { Grid, Box } from '@material-ui/core';
import { useCollectionGet } from '../../hooks/useCollectionGet';
import Firebase from '../../application/Firebase';
import { ChannelsScreen } from '../Channels/ChannelsScreen';
import { ServerList } from './ServerList';
import { Server } from '../../model/Server';
import { ServerIconButton } from './ServerIconButton';
import { HomeScreen } from '../Home/HomeScreen';
import { Switch, Route, useHistory, useLocation } from 'react-router';
import '../../extensions/arrayExtension';

export const ServersScreen: FunctionComponent = () => {
  const firestore = Firebase.firestore();
  const servers = useCollectionGet<Server>(firestore, (firestore) => firestore.collection("versions/1/servers"));
  const [selectedItemId, setSelectedItemId] = useState("");
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    servers.refresh();
  }, []);

  useEffect(() => {
    // 歯車ボタンからhomeに行った場合
    // (子コンポーネントのことを知ってるのは良いのか...?)
    if (location.pathname.split("/").get(1) === "home") {
      setSelectedItemId("home");
    }

  }, [location.pathname]);

  useEffect(() => {
    // ログイン or リロード時に選択サーバーを復帰する
    if (selectedItemId) { return; }

    // usePrams()ではRouteされてるコンポーネントからしかparamを取れないのでlocationを使う
    const serverId = location.pathname.split("/").get(1);

    if (serverId) {
      // URLから復帰時
      setSelectedItemId(serverId);
    } else {
      // どこのサーバーも指定していなかった場合、一番上のサーバーを選択する
      const serverId = servers.items.first()?.id;
      if (!serverId) { return; }

      setSelectedItemId(serverId);
      history.push(serverId);
    }
  }, [location.pathname, servers.items]);

  const handleListItemClick = (id: string) => {
      if (!id) { return; }
      setSelectedItemId(id);
      history.push(`/${id}`);
    };

  return (
    <Grid css={styles.root} container item sm direction={'row'}>
      <Box css={styles.servers}>
        <ServerIconButton
          css={styles.homeButton}
          tooltipTitle={'ホーム'}
          selected={selectedItemId === 'home'}
          onClick={(event) =>  handleListItemClick('home')}
        />
        <Box css={styles.line} />
        <ServerList
          servers={servers.items}
          itemSelected={(server) => server.id === selectedItemId}
          itemOnClick={(event, server) => handleListItemClick(server.id)} />
      </Box>
      <Grid item sm>
        <Switch>
          <Route exact path={'/home'} component={HomeScreen}/>
          <Route
            path={'/:serverId'}
            render={() => <ChannelsScreen key={selectedItemId} />}/>
        </Switch>
      </Grid>
    </Grid>
  );
};

const styles = {
  root: css`
    width: 100vw;
    background-color: #2E3137;
  `,
  servers: css`
    height: 100vh;
    width: 72px;
    background-color: #202225;
  `,
  homeButton: css`
    margin: 12px 0px 8px 0px;
  `,
  line: css`
    background-color: #2A2D30;
    height: 2px;
    width: 30px;
    margin: 4px 21px;
  `,
};
