/** @jsx jsx */
import { jsx, css } from '@emotion/core';
import dayjs from 'dayjs';
import 'dayjs/locale/ja';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { Box, Grid, Avatar, List, ListItem, Button, IconButton, Modal, Backdrop, Fade, makeStyles, Theme, createStyles, Link, Tooltip, Menu, MenuItem, ButtonBase } from '@material-ui/core';
import DescriptionIcon from '@material-ui/icons/Description';
import TagFacesIcon from '@material-ui/icons/TagFaces';
import GetAppIcon from '@material-ui/icons/GetApp';
import { Text } from '../../component/Text';
import { Message } from '../../model/Message';
import { File } from '../../model/File';
import axios from "axios";
import { saveAs } from "file-saver";
import { Emoji, EmojiData, Picker } from 'emoji-mart';
import 'emoji-mart/css/emoji-mart.css';
import { useWindowDimensions } from '../../hooks/useWindowDimensions';
import Firebase from '../../application/Firebase';
import useDocumentArrayUpdate from '../../hooks/useDocumentArrayUpdate';
import { ReactionEntity, ReactionValue } from '../../model/Reaction';
import { useMe } from '../../hooks/useMe';
import { useDocumentGet } from '../../hooks/useDocumentGet';
import { User } from '../../model/User';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    modalButton: {
      color: "#888889",
      fontWeight: 'bold',
      '&:hover': {
         color: "#F2F2F2",
         fontWeight: 'bold',
         textDecoration: 'underline white'
      },
    },
    fileName: {
      textTransform: 'none',
      '&:hover': {
        textDecoration: 'underline'
      }
    },
  })
);

const useTooltipStyles = makeStyles((theme: Theme) => ({
  arrow: {
    color: theme.palette.common.black,
  },
  tooltip: {
    backgroundColor: theme.palette.common.black,
    fontSize: 14,
    fontWeight: 'bold',
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 12,
    paddingRight: 12
  },
}));

type ItemProps = {
  message: Message;
};

const ImageView = (props: {file: File, onClick: () => void}) => {

  return (
    <img
      style={{maxWidth: 400, maxHeight: 400, marginTop: 8, borderRadius: 4}}
      src={props.file.url} alt={props.file.name}
      onClick={props.onClick} />
  );
};

const FileView = (props: {file: File}) => {

  // なんか直接リンクからダウンロードできないのでgetする
  // corsがうんたらでgetができなかったので、storage側に設定
  const downloadFile = async(file: File) => {
    const response = await axios.get(file.url, {responseType: "blob"});
    saveAs(new Blob([response.data], {type: file.type}), file.name);
  };

  const trimFileSize = (size: number) => {
    if (size < 1000) {
      return `${size}B`;
    } else if (size < 1000 * 1000) {
      return `${size / 1000}KB`;
    } else if (size < 1000 * 1000 * 1000) {
      return `${size / 1000 * 1000}MB`;
    }
  };

  const classes = useStyles();

  return (
    <Grid style={{maxWidth: 400}} css={itemStyles.attached} container direction={'row'} alignItems={'center'}>
      <DescriptionIcon fontSize={'large'} style={{color: '#F2F2F2', width: 44, height: 44}} />
      <Grid style={{maxWidth: "80%", width: 400}} item spacing={0}>
        <Button
          className={classes.fileName}
          style={{fontSize: 14, color: "#00B0F4", height: 8}}
          onClick={() => downloadFile(props.file!).catch(error => console.error(error))}>
            {props.file.name}
        </Button>
        <Text css={itemStyles.fileSize} fontSize={12} color={'#6C6F76'}>{trimFileSize(props.file.size)}</Text>
      </Grid>
      <IconButton style={{padding: 2}}>
        <GetAppIcon
          style={{color: '#B9BBBE', padding: 0}}
          onClick={() => downloadFile(props.file!).catch(error => console.error(error))}/>
      </IconButton>
    </Grid>
  );
};

const Item: FunctionComponent<ItemProps> = (props) => {
  const [isImageShowing, setIsImageShowing] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [isAddReactionMenuOpen, setIsAddReactionMenuOpen] = useState(false);
  const [addReactionAnchor, setAddReactionAnchor] = useState<null | HTMLElement>(null);
  const [reactionValues, setReactionValues] = useState<ReactionValue[]>([]);

  const { height } = useWindowDimensions();
  const reactions = useDocumentArrayUpdate(Firebase.firestore().collection("versions/1/messages").doc(props.message.id), "reactions");
  const me = useMe();

  useEffect(() => {
    if (!props.message.reactions) { return; }
    // Firestore上では配列inオブジェクトin配列が難しいため別フォーマットで保存している。
    // 配列inオブジェクトin配列にここで変換する
    let values: ReactionValue[] = [];

    props.message.reactions?.forEach(reaction => {
      const exist = values.findIndex(value => value.emojiId === reaction.emojiId);
      if (exist !== -1) {
        // 同一絵文字が存在する場合
        let newValues = values.concat();
        newValues[exist].users.push(reaction.user);
        values = newValues;

      } else {
        // 同一絵文字が存在しない場合
        const value: ReactionValue = {
          showPriority: reaction.showPriority,
          emojiId: reaction.emojiId,
          users: [reaction.user]
        };
        values = values.concat(value);
      }
    });

    // showIndex順にソートする
    // Aが:bow: Bが:cat: Cが:bow: の後Aが:bow:を削除すると
    // DB上では :cat: :bow:の順になってしまうが、表示は :bow: :cat:が望ましく、showPriorityで修正する。
    values.sort((a, b) => a.showPriority - b.showPriority);
    setReactionValues(values);
  }, [props.message.reactions]);

  const formatDate = (date: Date): string => {
    const oneDay = 24 * 60 * 60 * 1000;
    const now = Date.now();

    const diffDay = Math.floor((now - date.getTime()) / oneDay);

    if (diffDay === 0) {
      return dayjs(date).locale('ja').format('今日 hh:mm');
    } else if (diffDay === 1) {
      return dayjs(date).locale('ja').format('昨日 hh:mm');
    } else {
      return dayjs(date).locale('ja').format('YYYY/MM/DD');
    }
  };

  const onSelectEmoji = (emoji: EmojiData) => {
    const exist = reactionValues.find(value => value.emojiId === emoji.id);

    if (exist) {
      // すでにAddReactionしている
      if (exist.users.map(user => user.id).includes(me.item!.id)) {
        setIsAddReactionMenuOpen(false);
        return;
      }

      const reaction: ReactionEntity = {
        showPriority: exist.showPriority,
        emojiId: emoji.id!,
        user: me.item!
      };
      reactions.add<ReactionEntity>(reaction)
        .catch(e => console.error(e));
    } else {
      const reaction: ReactionEntity = {
        showPriority: reactionValues.length,
        emojiId: emoji.id!,
        user: me.item!
      };
      reactions.add<ReactionEntity>(reaction)
        .catch(e => console.error(e));
    }

    setIsAddReactionMenuOpen(false);
  };

  const onClickReaction = (reaction: ReactionValue, index: number) => {
    const self = reaction.users.find(user => user.id === me.item!.id);
    if (self) {
      // 削除
      const reactionEntity: ReactionEntity = {
        showPriority: reaction.showPriority,
        emojiId: reaction.emojiId,
        // userオブジェクトを削除する場合全く同じオブジェクトを指定する必要があるため
        // me.item!ではなく、取得した情報内のuserを利用する
        user: self
      };
      reactions.remove<ReactionEntity>(reactionEntity)
        .catch(e => console.error(e));
    } else {
      // 追加
      const reactionEntity: ReactionEntity = {
        showPriority: reaction.showPriority,
        emojiId: reaction.emojiId,
        user: me.item!
      };
      reactions.add<ReactionEntity>(reactionEntity)
        .catch(e => console.error(e));
    }
  };

  const classes = useStyles();
  const tooltipClasses = useTooltipStyles();

  return (
    <ListItem css={itemStyles.background} onMouseEnter={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)}>
      <Grid css={itemStyles.root} container direction='row' >
        <Avatar css={css`margin-right: 16px;`} src={props.message.user.imageUrl} />
        <Grid style={{width: "90%"}} item>
          <Grid item container direction='row' >
            <Text color={'#FFFFFF'} fontWeight={'500'}>{props.message.user.name}</Text>
            <Text css={itemStyles.date} color={'#6C6F76'} fontSize={12}>{formatDate(props.message.createTime.toDate())}</Text>
          </Grid>
          <Text color={'#E6E7E7'} fontWeight={'500'}>{props.message.content}</Text>
          {props.message?.file && props.message.file.type.includes("image") &&
            <ImageView file={props.message.file!} onClick={() => setIsImageShowing(true)}/>
          }
          {props.message?.file && !props.message.file.type.includes("image") &&
            <FileView file={props.message.file!} />
          }
          <Grid container direction={'row'} css={itemStyles.reaction.items}>
            {
              reactionValues.map((reaction, index) => {
                return (
                  <Tooltip classes={tooltipClasses} arrow title={`${reaction.users.map(user => user.name).join(", ")}\nが:${reaction.emojiId}:で反応しました`} placement={'top'}>
                    <ButtonBase key={index} onClick={() => onClickReaction(reaction, index)}>
                      <Box css={itemStyles.reaction.item} style={{backgroundColor: reaction.users.map(user => user.id).includes(me.item?.id ?? "") ? "#49516D" : "#3F4145"}}>
                        <Grid css={itemStyles.reaction.inner} container direction={'row'}>
                          <Emoji emoji={reaction.emojiId} size={20}/>
                          <Text css={itemStyles.reaction.text} color={reaction.users.map(user => user.id).includes(me.item?.id ?? "") ? '#6B7EC6' : '#666A70'}>{reaction.users.length}</Text>
                        </Grid>
                      </Box>
                    </ButtonBase>
                  </Tooltip>
                );
              })
            }
          </Grid>
        </Grid>
      </Grid>
      {isHover &&
        <Tooltip classes={tooltipClasses} arrow title={'リアクションをつける'} placement={'top'}>
          <Box css={itemStyles.addReactionButton}>
            <IconButton style={{width: 30, height: 30}} onClick={e => {setIsAddReactionMenuOpen(true); setAddReactionAnchor(e.currentTarget);}}>
              <TagFacesIcon style={{color: '#B9BBBE', padding: 2}}/>
            </IconButton>
          </Box>
        </Tooltip>
      }
      <Menu
        open={isAddReactionMenuOpen}
        keepMounted
        anchorEl={addReactionAnchor}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        onClose={() => setIsAddReactionMenuOpen(false)}
      >
        {/* 最初から表示させるとレンダリングが重くなるので対応 */}
        {isAddReactionMenuOpen && <Picker
          title={''}
          emoji={''}
          set={'apple'}
          i18n={{
            search: '検索',
            categories: {
              search: '検索結果',
              recent: 'よく使う絵文字',
              people: '顔 & 人',
              nature: '動物 & 自然',
              foods: '食べ物 & 飲み物',
              activity: 'アクティビティ',
              places: '旅行 & 場所',
              objects: 'オブジェクト',
              symbols: '記号',
              flags: '旗',
              custom: 'カスタム',
            },
          }}
          onSelect={onSelectEmoji}
        />}
      </Menu>
      <Modal
        style={{display:'flex',alignItems:'center',justifyContent:'center'}}
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={isImageShowing}
        onClose={() => setIsImageShowing(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}>
        <Fade in={isImageShowing}>
          <Box style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', outline: 'none', maxWidth: '60%'}}>
            <img
              style={{maxWidth: "100%", maxHeight: height * 0.7}}
              src={props.message.file?.url} alt={props.message.file?.name}/>
            <Button
              className={classes.modalButton}
              onClick={() => window.open(props.message.file?.url)}>
              元ファイルを開く
            </Button>
          </Box>
        </Fade>
      </Modal>
    </ListItem>
  );
};

type Props = {
  className?: string;
  messages: Message[];
};

export const MessageList: FunctionComponent<Props> = (props) => {

  return (
    <List className={props.className} style={{backgroundColor: "#37393E", display: 'flex', flexDirection: 'column-reverse', overflow: 'auto'}}>
      {props.messages.map(message =>
        <Item key={message.id} message={message} />
      )}
    </List>
  );
};

const itemStyles = {
  background: css`
    background-color: #37393E;
    &:hover {
      background-color: #33353A;
    }
  `,
  root: css`
    padding: 4px 0px;
  `,
  date: css`
    margin-left: 6px;
  `,
  attached: css`
   background-color: #2E3137;
   margin: 8px 0px;
   padding: 8px 8px;
   border-radius: 4px;
  `,
  fileSize: css`
    margin-top: 2px;
    margin-left: 8px;
  `,
  addReactionButton: css`
    background-color: #37393E;
    position: absolute;
    top: 0px;
    right: 12px;
    width: 30px;
    height: 30px;
    border-style: solid;
    border-radius: 6px;
    border-width: 1.5px;
    border-color: #2C2E32;
    &:hover {
      box-shadow: 0 2px 2px 0 rgba(0, 0, 0, .5);
    }
  `,
  reaction: {
    items: css`
      margin-top: 2px;
    `,
    item: css`
      width: 46px;
      height: 22px;
      margin-right: 2px;
      border-radius: 4px;
    `,
    inner: css`
      margin: 0px 4px;
    `,
    text: css`
      margin-left: 8px;
    `
  }
};
