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
  List: object[];
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
