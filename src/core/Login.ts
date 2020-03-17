import fs from "fs";
import { req } from "./tool/Req";
import { BaseRequest, wx_key, User } from "./Types";
import { Examples } from "./Examples";
import wxConfig from "./wxConfig";

export class Login {
  private cachePath: string = wxConfig.cachePath;
  private get _refreshDeviceID() {
    return "e" + ("" + Math.random().toFixed(15)).substring(2, 17);
  }
  private readonly _url =
    "https://login.wx.qq.com/jslogin?appid=wx782c26e4c19acffb&redirect_uri=https%3A%2F%2Fwx.qq.com%2Fcgi-bin%2Fmmwebwx-bin%2Fwebwxnewloginpage&fun=new&lang=zh_CN";
  constructor(private port_init: Examples) {
    req.http({ url: this._url }).then((data: string) => {
      const uuid = data.match(/window.QRLogin.uuid = "(.*?)"/)[1];
      this.getQr(uuid, `${this.cachePath}QR.jpg`);
    });
  }

  private getQr(uuid: string, fileName: string) {
    const url = `https://login.weixin.qq.com/qrcode/${uuid}`;
    req.download(url, fileName).then(_ => {
      console.log("Qr code has been loaded");
      this._getStatus(uuid);
    });
  }
  private _getStatus(uuid: string) {
    req
      .http({
        url:
          "https://login.wx.qq.com/cgi-bin/mmwebwx-bin/login?loginicon=true&tip=0&uuid=" +
          uuid
      })
      .then((data: string) => {
        const reg = /window\.([\w]{4,15})[ ]{0,3}=[ ]{0,3}([\d]{3}|.+);/gm,
          regStr = /^('|")(.*?)('|")$/,
          dataP = {};
        data.replace(reg, ($, $1, $2) => {
          dataP[$1] = regStr.test($2) ? $2.replace(regStr, "$2") : parseInt($2);
          return $;
        });
        this._disposeStatus(dataP);
        if (dataP["code"] === 201 || dataP["code"] === 408) {
          this._getStatus(uuid);
        }
      });
  }
  private _disposeStatus(data: object) {
    /**
     * code：
     *      200: 登陆成功
     *      201：扫描成功，但未点确认 获取头像
     *      408：未扫描
     *      400：未知
     *      500：login poll srv exception
     */
    console.log(data);
    if (data["code"] == 201) {
      // 获取头像
      this.getHeadPortrait(data["userAvatar"]);
      console.log(data["code"], " - 获取头像");
    } else if (data["code"] == 200) {
      // 登陆成功
      this.loginSuccess(data["redirect_uri"]);
      console.log(data["code"], " - 登陆成功");
    } else if (data["code"] == 408) {
      console.log(data["code"], " - 未扫码，正在等待...");
    } else {
      console.log(data["code"], " - 登陆失败，已退出程序。");
    }
  }
  private getHeadPortrait(userAvatar: string) {
    const image = Buffer.from(userAvatar, "base64"); // 这是另一种写法
    console.log(image);
  }
  private loginSuccess(redirect_uri: string) {
    fs.unlinkSync(`${this.cachePath}QR.jpg`);
    req
      .http({ url: `${redirect_uri}&fun=new&version=v2&lang=zh_CN` })
      .then((data: string) => {
        const wx_key = {
          ret: data.match(/<ret>(.*)<\/ret>/)[1],
          skey: data.match(/<skey>(.*)<\/skey>/)[1],
          wxsid: data.match(/<wxsid>(.*)<\/wxsid>/)[1],
          wxuin: data.match(/<wxuin>(.*)<\/wxuin>/)[1],
          passticket: data.match(/<pass_ticket>(.*)<\/pass_ticket>/)[1],
          message: data.match(/<message>(.*)<\/message>/)[1]
        };
        this.init(wx_key);
      });
  }
  private init(wx_key: wx_key) {
    const BaseRequest: BaseRequest = {
      DeviceID: this._refreshDeviceID,
      Sid: wx_key.wxsid,
      Uin: wx_key.wxuin,
      SKey: ""
    };
    req
      .http({
        // 初始化
        type: "POST",
        url: "https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxinit?lang=zh_CN",
        data: JSON.stringify({ BaseRequest })
      })
      .then((initData: string) => {
        const { SyncKey, User, SKey } = JSON.parse(initData);
        BaseRequest.SKey = SKey;
        const submit_stateUrl = `https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxsync?sid=${BaseRequest.Sid}&skey=${BaseRequest.SKey}&lang=zh_CN&pass_ticket=${wx_key.passticket}`;
        const submit_data = {
          BaseRequest,
          SyncKey,
          rr: ~new Date()
        };

        this.User = User;
        this.BaseRequest = BaseRequest;
        this.wx_key = wx_key;
        this.refreshSyncKey(submit_stateUrl, submit_data); // 递归
      });
  }
  private User: User;
  private BaseRequest: BaseRequest;
  private wx_key: wx_key;
  private refreshSyncKey(submit_stateUrl: string, submit_data: object) {
    setTimeout(() => {
      req
        .http({
          type: "POST",
          url: submit_stateUrl,
          data: JSON.stringify(submit_data)
        })
        .then((data: string) => {
          const { SyncKey } = JSON.parse(data);
          if (SyncKey.Count >= 8) {
            // 出口 - 初始化完成
            console.log(" -- 初始化完成 and Login END");
            this.port_init.init({
              BaseRequest: this.BaseRequest,
              SyncKey,
              wx_key: this.wx_key,
              submit_stateUrl,
              User: this.User
            });
          } else {
            this.refreshSyncKey(submit_stateUrl, submit_data); // 递归
          }
        });
    }, 2000);
  }
}
