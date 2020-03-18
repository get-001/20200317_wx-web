import fs from "fs";
import { Login } from "./Login";
import { initData, BaseRequest, Dynamic, ContactAll, Member } from "./Types";
import wxConfig from "./wxConfig";
import { req } from "./tool/Req";
import { Heartbeat } from "./Heartbeat";

export class Examples {
  private cachePath: string = wxConfig.cachePath;
  private writeFile(path: string, content: string) {
    fs.writeFile(path, content, () => {}); // 写入到文件
  }
  private _key_data?: initData;
  get key_data(): initData {
    const DeviceID = "e" + ("" + Math.random().toFixed(15)).substring(2, 17);
    this._key_data.BaseRequest["DeviceID"] = DeviceID;
    this.key_data = this._key_data;
    return this._key_data;
  }
  set key_data(val: initData) {
    this._key_data = val;
    this.writeFile(
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
    this.writeFile(
      this.cachePath + "contactAll.json",
      JSON.stringify(val, null, 2)
    );
  }

  constructor() {
    // 开始登录时创建缓存目录
    fs.existsSync(this.cachePath) || fs.mkdirSync(this.cachePath);
    this.login();
  }

  login() {
    new Login(this);
  }
  onLoad(key_data: initData) {
    // 微信登录成功开始初始化
    this.key_data = key_data; // 写入关键信息
    this.getContactAll(); // 获取完整的通讯录数据
    new Heartbeat(this);

    // setInterval(() => {
    // 消息发送测试
    // this.sendMessage("filehelper", `- 测试 ${-new Date()}`);
    // }, 15000);
  }
  onRuit(statusCode) {
    // 退出登录时清空缓存目录
    console.log(statusCode, " -- 微信退出登陆");
  }
  onReceiveDynamic(dynamicData: Dynamic) {
    // 接收新动态事件(消息)
    let dataArr = dynamicData.AddMsgList.filter(
      ({ MsgType }) => MsgType !== 51
    );
    if (dataArr.length === 0) return;

    // -------------------------------------------------------------
    const MemberList: Member[] = this.contactAll.MemberList;
    dataArr = dataArr.map(({ MsgType, ToUserName, Content }) => {
      let NickName = "";
      MemberList.forEach(member => {
        if (ToUserName === member.UserName) NickName = member.NickName;
      });
      return { MsgType, ToUserName, NickName, Content };
    }) as [];
    console.log(JSON.stringify(dataArr));
    // -------------------------------------------------------------

    this.writeFile(
      this.cachePath + "dynamic.json",
      JSON.stringify(dynamicData, null, 2)
    );
  }
  getContactAll() {
    // 获取完整的通讯录数据
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
  /**
   * 发送消息
   * @param {string} toUserName 发送人ID
   * @param {string} content 需要发送的文本消息
   * @memberof Examples
   */
  sendMessage(toUserName: string, content: string) {
    const { BaseRequest, User } = this.key_data;
    const MsgId = (Date.now() + Math.random().toFixed(3)).replace(".", "");
    const submit_data = {
      BaseRequest: BaseRequest,
      Msg: {
        ClientMsgId: MsgId,
        Content: content,
        FromUserName: User.UserName,
        LocalID: MsgId,
        ToUserName: toUserName,
        Type: 1
      },
      Scene: 0
    };
    req.http({
      type: "POST",
      url: "https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsg",
      data: JSON.stringify(submit_data)
    });
  }
  // 获取语音
  getVoiceUrl(msgid: string) {
    const { BaseRequest } = this.key_data;
    return `https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgetvoice?msgid=${msgid}&skey=${BaseRequest.SKey}`;
  }
  // 获取图片
  getImageUrl(msgid: string, artwork: boolean = true) {
    const { BaseRequest } = this.key_data;
    return `https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgetmsgimg?MsgID=${msgid}&skey=${
      BaseRequest.SKey
    }${artwork && "&type=slave"}`;
  }
}
