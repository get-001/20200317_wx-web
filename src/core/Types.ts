export interface BaseRequest {
  SKey: string;
  DeviceID: string;
  Sid: string;
  Uin: string;
}

export interface wx_key {
  ret: string;
  skey: string;
  wxsid: string;
  wxuin: string;
  passticket: string;
  message: string;
}

export interface SyncKey {
  Count: number;
  List: { Key: number; Val: number }[];
}

export interface User {
  Uin: number;
  UserName: string;
  NickName: string;
  HeadImgUrl: string;
  RemarkName: string;
  PYInitial: string;
  PYQuanPin: string;
  RemarkPYInitial: string;
  RemarkPYQuanPin: string;
  HideInputBarFlag: number;
  StarFriend: number;
  Sex: number;
  Signature: string;
  AppAccountFlag: number;
  VerifyFlag: number;
  ContactFlag: number;
  WebWxPluginSwitch: number;
  HeadImgFlag: number;
  SnsFlag: number;
}

export interface initData {
  BaseRequest: BaseRequest;
  SyncKey: SyncKey;
  wx_key: wx_key;
  User: User;
  submit_stateUrl: string;
}

export interface Member {
  Uin: number;
  UserName: string;
  NickName: string;
  HeadImgUrl: string;
  ContactFlag: number;
  MemberCount: number;
  MemberList: [];
  RemarkName: string;
  HideInputBarFlag: number;
  Sex: number;
  Signature: string;
  VerifyFlag: number;
  OwnerUin: number;
  PYInitial: string;
  PYQuanPin: string;
  RemarkPYInitial: string;
  RemarkPYQuanPin: string;
  StarFriend: number;
  AppAccountFlag: number;
  Statues: number;
  AttrStatus: number;
  Province: string;
  City: string;
  Alias: string;
  SnsFlag: number;
  UniFriend: number;
  DisplayName: string;
  ChatRoomId: number;
  KeyWord: string;
  EncryChatRoomId: string;
  IsOwner: number;
}

type BaseResponse = {
  Ret: number;
  ErrMsg: string;
};

export interface ContactAll {
  BaseResponse: BaseResponse;
  MemberCount: number;
  MemberList?: Member[];
  Seq: number;
}

export interface AddMsg {
  MsgId: string;
  FromUserName: string;
  ToUserName: string;
  MsgType: number;
  Content: string;
  Status: number;
  ImgStatus: number;
  CreateTime: number;
  VoiceLength: number;
  PlayLength: number;
  FileName: string;
  FileSize: string;
  MediaId: string;
  Url: string;
  AppMsgType: number;
  StatusNotifyCode: number;
  StatusNotifyUserName: string;
  RecommendInfo: {
    UserName: string;
    NickName: string;
    QQNum: number;
    Province: string;
    City: string;
    Content: string;
    Signature: string;
    Alias: string;
    Scene: number;
    VerifyFlag: number;
    AttrStatus: number;
    Sex: number;
    Ticket: string;
    OpCode: number;
  };
  ForwardFlag: number;
  AppInfo: {
    AppID: string;
    Type: number;
  };
  HasProductId: number;
  Ticket: string;
  ImgHeight: number;
  ImgWidth: number;
  SubMsgType: number;
  NewMsgId: number;
  OriContent: string;
  EncryFileName: string;
}

type Profile = {
  BitFlag: number;
  UserName: {
    Buff: string;
  };
  NickName: {
    Buff: string;
  };
  BindUin: number;
  BindEmail: {
    Buff: string;
  };
  BindMobile: {
    Buff: string;
  };
  Status: number;
  Sex: number;
  PersonalCard: number;
  Alias: string;
  HeadImgUpdateFlag: number;
  HeadImgUrl: string;
  Signature: string;
};

export interface Dynamic {
  BaseResponse: BaseResponse;
  AddMsgCount: number;
  AddMsgList: AddMsg[];
  ModContactCount: number;
  ModContactList: [];
  DelContactCount: number;
  DelContactList: [];
  ModChatRoomMemberCount: number;
  ModChatRoomMemberList: [];
  Profile: Profile;
  ContinueFlag: number;
  SyncKey: SyncKey;
  SKey: string;
  SyncCheckKey: SyncKey;
}
export interface Message {
  type: string;
  initiative: boolean;
  MsgId: string;
  CreateTime: number;
  contact: {
    type: string;
    id: string;
    name: string;
    children: {
      id: string;
      name: string;
    } | null;
  };
  data: object | string | null;
}
