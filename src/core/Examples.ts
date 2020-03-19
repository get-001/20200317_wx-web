import fs from "fs";
import { Login } from "./Login";
import {
  initData,
  BaseRequest,
  Dynamic,
  ContactAll,
  Member,
  AddMsg,
  Message
} from "./Types";
import wxConfig from "./wxConfig";
import { req } from "./tool/Req";
import { Heartbeat } from "./Heartbeat";
import { Tool } from "./tool";
import { fstat } from "fs";

abstract class Examples_abstract {
  protected cachePath: string = wxConfig.cachePath;
  private _key_data?: initData;
  get key_data(): initData {
    const DeviceID = "e" + ("" + Math.random().toFixed(15)).substring(2, 17);
    this._key_data.BaseRequest["DeviceID"] = DeviceID;
    this.key_data = this._key_data;
    return this._key_data;
  }
  set key_data(val: initData) {
    this._key_data = val;
    Tool.writeFile(
      this.cachePath + "key_data.json",
      JSON.stringify(val, null, 2)
    );
  }
  private _contactAll?: ContactAll;
  get contactAll(): ContactAll {
    return this._contactAll;
  }
  set contactAll(val: ContactAll) {
    this._contactAll = val;
    Tool.writeFile(
      this.cachePath + "contactAll.json",
      JSON.stringify(val, null, 2)
    );
  }
  private _currentMessage?: AddMsg;
  get currentMessage(): AddMsg {
    return this._currentMessage;
  }
  set currentMessage(val: AddMsg) {
    this._currentMessage = val;
    Tool.writeFile(
      this.cachePath + "dynamic.json",
      JSON.stringify(val, null, 2)
    );
  }
  /**
   * 获取完整的通讯录数据，更新到 this.contactAll
   * @memberof Examples_abstract
   */
  getContactAll() {
    const { BaseRequest } = this.key_data;
    req
      .http({
        url: `https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgetcontact?lang=zh_CN&seq=0&SKey=${BaseRequest.SKey}`
      })
      .then((data: string) => {
        const contactAll = JSON.parse(data);
        this.contactAll = contactAll;
      });
  }
  // 获取语音
  getVoice(msgid: string, path: string) {
    const { BaseRequest } = this.key_data;
    return req.download(
      `https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgetvoice?msgid=${msgid}&skey=${BaseRequest.SKey}`,
      path
    );
  }
  // 获取图片
  getImage(msgid: string, path: string, artwork?: boolean) {
    const { BaseRequest } = this.key_data;
    return req.download(
      `https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgetmsgimg?MsgID=${msgid}&skey=${
        BaseRequest.SKey
      }${artwork || "&type=slave"}`,
      path
    );
  }
  // 获取小视频
  getVideo(msgid: string, path: string) {
    const { BaseRequest } = this.key_data;
    return req.download(
      `https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgetvideo?msgid=${msgid}&skey=${BaseRequest.SKey}`,
      path
    );
  }
}

export class Examples extends Examples_abstract {
  login() {
    new Login(this);
  }
  constructor(takeCache) {
    super();
    // 开始登录时创建缓存目录
    Tool.mkdirSync(this.cachePath);
    if (takeCache) {
      try {
        // const cookie = JSON.parse(
        //   fs.readFileSync(this.cachePath + "cookie.json").toString()
        // );
        // console.log(req._jar["_jar"]["store"]["idx"]);
        const key_data = JSON.parse(
          fs.readFileSync(this.cachePath + "key_data.json").toString()
        );
        this.onLoad(key_data);
      } catch (error) {
        this.login();
      }
    } else {
      this.login();
    }
  }
  onLoad(key_data: initData) {
    // 更新cookie
    const cookie = req._jar["_jar"]["store"]["idx"];
    Tool.writeFile(
      this.cachePath + "cookie.json",
      JSON.stringify(cookie, null, 2)
    );
    // 微信登录成功开始初始化
    this.key_data = key_data; // 写入关键信息
    this.getContactAll(); // 获取完整的通讯录数据
    new Heartbeat(this);
    setTimeout(() => {
      // 消息发送测试
      this.sendMessage(this.key_data.User.UserName, `- Test ${-new Date()}`);
      this.sendMessage(
        this.key_data.User.UserName,
        `- Test ${-new Date()}`
      ).then(data => {
        setTimeout(() => {
          this.revokeMsg(data);
        }, 2000);
      });
    }, 5000);
  }
  onRuit(statusCode) {
    // 退出登录时清空缓存目录
    console.log(statusCode, " -- 微信退出登陆");
    Tool.deletePathSync(this.cachePath); // 删除缓存目录
  }
  /**
   * 发送消息
   * @param {string} toUserName 发送人ID
   * @param {string} content 需要发送的文本消息
   * @returns {Promise<object>} 返回的数据用于撤回操作
   * @memberof Examples
   */
  sendMessage(ToUserName: string, Content: string): Promise<object> {
    const { BaseRequest, User } = this.key_data;
    const MsgId = (Date.now() + Math.random().toFixed(3)).replace(".", "");
    const submit_data = {
      BaseRequest: BaseRequest,
      Msg: {
        ClientMsgId: MsgId,
        Content,
        FromUserName: User.UserName,
        LocalID: MsgId,
        ToUserName,
        Type: 1
      },
      Scene: 0
    };
    return req
      .http({
        type: "POST",
        url: "https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsg",
        data: JSON.stringify(submit_data)
      })
      .then((data: string) => {
        const { LocalID, MsgID } = JSON.parse(data);
        return {
          ToUserName,
          ClientMsgId: LocalID,
          SvrMsgId: MsgID
        };
      });
  }
  /**
   * 接收新动态事件(消息)
   * @param {Dynamic} dynamicData
   * @memberof Examples
   */
  onReceiveDynamic(dynamicData: Dynamic) {
    const { AddMsgList } = dynamicData;
    AddMsgList.forEach(AddMsg => this.translateMessage(AddMsg));
  }
  /**
   *
   * @protected
   * @param {AddMsg} msg
   * @returns
   * @memberof Examples
   */
  translateMessage(msg: AddMsg) {
    if (msg.MsgType === 51) return; // 屏蔽
    this.currentMessage = msg;
    const { User } = this.key_data;
    const { MemberList } = this.contactAll;
    const message = {
      type: "",
      MsgId: msg.MsgId,
      initiative: false,
      CreateTime: msg.CreateTime,
      contact: { type: "", id: "", name: "", children: null },
      data: null
    };
    // FromUserName -- 发送人ID
    //   ToUserName -- 收信人ID
    if (User.UserName === msg.FromUserName) message["initiative"] = true;
    message["contact"]["id"] = message["initiative"]
      ? msg.ToUserName
      : msg.FromUserName;
    MemberList.some(({ UserName, RemarkName, NickName }) => {
      /*
       *   ID -- UserName
       * 备注 -- RemarkName
       * 昵称 -- NickName
       */
      if (message["contact"]["id"] === UserName) {
        message["contact"]["name"] = RemarkName || NickName;
        return true;
      }
    });

    if (msg.MsgType === 1) {
      // 文本 | 普通定位 | 群公告
      message["type"] = "Common";
      message["data"] = msg.Content;
    } else if (msg.MsgType === 3) {
      // 图片
      message["type"] = "Image";
      message["data"] = "[图片]";
    } else if (msg.MsgType === 34) {
      // 语音
      message["type"] = "Voice";
      message["data"] = "[语音]";
    } else if (msg.MsgType === 43) {
      // 小视频
      message["type"] = "Video";
      message["data"] = "[小视频]";
    } else if (msg.MsgType === 47) {
      // 表情包
      message["type"] = "Emoji";
      message["data"] = "[表情包]";
    } else if (msg.MsgType === 42) {
      // 名片
      message["type"] = "Business-card";
      message["data"] = "[名片]";
    } else if (msg.MsgType === 49) {
      // 文件 | 收藏 | 链接/文章 | 发起位置共享 | 转账
      message["type"] = "File";
      message["data"] = "[文件/收藏类..]";
    } else if (msg.MsgType === 10000) {
      // 发起群聊 | 加入群聊 | 修改群名 | 位置共享结束 | 发出红包 | 移出群聊 | 群提示
      message["type"] = "Group-of-prompt";
      message["data"] = "[群提示]";
    } else if (msg.MsgType === 10002) {
      // 消息撤回
      message["type"] = "Withdraw";
      message["data"] = "[消息撤回]";
    } else {
      // 其他
      message["type"] = "Else";
      message["data"] = "[其他]";
      console.log(JSON.stringify(msg));
    }
    this.message(message);
  }

  private _MsgDataAll: object = {};
  get MsgDataAll(): object {
    return this._MsgDataAll;
  }
  set MsgDataAll(val: object) {
    this._MsgDataAll = val;
    Tool.writeFile(
      this.cachePath + "MsgDataAll.json",
      JSON.stringify(val, null, 2)
    );
  }
  message(msg: Message) {
    let { MsgDataAll } = this;
    const id = msg.contact.id;
    const arr = MsgDataAll[id] || [];
    MsgDataAll[id] = [...arr, msg];
    this.MsgDataAll = MsgDataAll;
  }

  /**
   * 撤回消息
   * @param {*} { ToUserName, ClientMsgId, SvrMsgId }
   * @memberof Examples
   */
  revokeMsg({ ToUserName, ClientMsgId, SvrMsgId }: any) {
    const {
      BaseRequest,
      wx_key: { passticket }
    } = this.key_data;
    const submit_data = {
      BaseRequest,
      ToUserName,
      ClientMsgId,
      SvrMsgId
    };
    req.http({
      type: "POST",
      url: `https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxrevokemsg?lang=zh_CN&pass_ticket=${passticket}`,
      data: JSON.stringify(submit_data)
    });
  }
}
