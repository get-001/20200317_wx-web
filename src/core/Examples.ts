import fs from "fs";
import { Login } from "./Login";
import { initData, BaseRequest, Dynamic, ContactAll } from "./Types";
import wxConfig from "./wxConfig";
import { req } from "./tool/Req";
import { Heartbeat } from "./Heartbeat";

export class Examples {
  private cachePath: string = wxConfig.cachePath;
  private writeFile(path: string, content: string) {
    fs.writeFile(path, content, () => {}); // 写入到文件
  }
  public get DeviceID(): string {
    return "e" + ("" + Math.random().toFixed(15)).substring(2, 17);
  }
  private _key_data?: initData;
  get key_data(): initData {
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
    this.login();
  }

  login() {
    new Login(this);
  }
  onLoad(key_data: initData) {
    // 微信登录成功开始初始化
    this.key_data = key_data; // 写入关键信息
    this.getContactAll(); // 获取完整的通讯录数据
    new Heartbeat(
      this,
      key_data.BaseRequest,
      key_data.SyncKey,
      key_data.submit_stateUrl
    );
    setInterval(() => {
      // 消息发送测试
      this.sendMessage("filehelper", `- 测试 ${-new Date()}`);
    }, 5000);
  }
  onRuit(statusCode) {
    // 退出登录时清空缓存目录
    console.log(statusCode, " -- 微信退出登陆");
  }
  onReceiveDynamic(dynamicData: Dynamic) {
    // 接收新动态事件(消息)
    console.log(
      dynamicData.AddMsgList.length,
      dynamicData.AddMsgList.map(({ MsgType, FileName, Content }) => {
        return { MsgType, FileName, Content };
      })
    );
    const arr = dynamicData.AddMsgList.filter(({ MsgType }) => MsgType !== 51);
    if (arr.length === 0) return;
    arr.forEach(data => {
      console.log(data.MsgType + "  --  ", data.Content);
    });

    this.writeFile(
      this.cachePath + "dynamic.json",
      JSON.stringify(dynamicData, null, 2)
    );
  }
  getContactAll() {
    // 获取完整的通讯录数据
    const {
      BaseRequest: { SKey }
    } = this.key_data;
    req
      .http({
        url: `https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgetcontact?lang=zh_CN&seq=0&SKey=${SKey}`
      })
      .then((data: string) => {
        const contactAll = JSON.parse(data);
        this.contactAll = contactAll;
      });
  }
  sendMessage(toUserName: string, content: string) {
    const { BaseRequest } = this.key_data;
    BaseRequest.DeviceID = this.DeviceID;
    this.key_data = { ...this.key_data, BaseRequest };
    const MsgId = (Date.now() + Math.random().toFixed(3)).replace(".", "");
    const submit_data = {
      BaseRequest: BaseRequest,
      Msg: {
        ClientMsgId: MsgId,
        Content: content,
        FromUserName: this.key_data.User.UserName,
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
}
