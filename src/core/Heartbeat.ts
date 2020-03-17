import { req } from "./tool/Req";
import { BaseRequest, SyncKey } from "./Types";
import { Examples } from "./Examples";

/**
 * 专门用来维持微信心跳，获取信息跟状态
 * @export
 * @class Heartbeat
 */
export class Heartbeat {
  private getFormateSyncCheckKey(SyncKey) {
    const synccheckkeyList = SyncKey.List,
      synccheckkeyFormat = [];
    for (var i = 0, len = synccheckkeyList.length; i < len; i++) {
      synccheckkeyFormat.push(
        synccheckkeyList[i].Key + "_" + synccheckkeyList[i].Val
      );
    }
    return synccheckkeyFormat.join("|");
  }
  public get DeviceID(): string {
    return "e" + ("" + Math.random().toFixed(15)).substring(2, 17);
  }

  private get BaseRequest(): BaseRequest {
    return this._BaseRequest;
  }
  private set BaseRequest(val: BaseRequest) {
    this.port_Examples.key_data = {
      ...this.port_Examples.key_data,
      BaseRequest: val
    };
    this._BaseRequest = val;
  }
  private get SyncKey(): SyncKey {
    return this._SyncKey;
  }
  private set SyncKey(val: SyncKey) {
    this.port_Examples.key_data = {
      ...this.port_Examples.key_data,
      SyncKey: val
    };
    this._SyncKey = val;
  }
  private get stateUrl(): string {
    return this._stateUrl;
  }

  constructor(
    private port_Examples: Examples,
    private _BaseRequest: BaseRequest,
    private _SyncKey: SyncKey,
    private _stateUrl: string
  ) {
    this.maintain(); // 维持心跳
  }

  private maintain() {
    this.BaseRequest = { ...this.BaseRequest, DeviceID: this.DeviceID };
    req
      .http({
        url: `https://webpush.wx2.qq.com/cgi-bin/mmwebwx-bin/synccheck?r=${+new Date()}&skey=${
          this.BaseRequest["SKey"]
        }&sid=${this.BaseRequest["Sid"]}&uin=${
          this.BaseRequest["Uin"]
        }&deviceid=${
          this.BaseRequest["DeviceID"]
        }&synckey=${this.getFormateSyncCheckKey(this.SyncKey)}`
      })
      .then((data: any) => {
        console.log(data);
        data = data.match(
          /^window.synccheck={retcode:"([\d]+)",selector:"([\d]+)"}$/
        );
        const synccheck: { retcode: number; selector: number } = {
          retcode: parseInt(data[1]),
          selector: parseInt(data[2])
        };
        /*
         * synccheck['retcode'] : 0==正常连接 1101||1102==退出 1100 == 重载
         */
        if (synccheck["retcode"] == 0) {
          setTimeout(() => {
            this.maintain(); // 递归 - 继续监控动态
          }, 2000);
          // 正常连接 - 判断是否需要同步动态
          /*
           * synccheck["selector"]  0 -- 不需要同步动态  2 -- 有新的动态
           */
          if (synccheck["selector"] !== 0) {
            this.receiveState();
          }
        } else {
          // 连接异常 - 微信退出登陆
          this.port_Examples.onRuit(synccheck["retcode"]);
        }
      });
  }
  private receiveState() {
    this.BaseRequest = { ...this.BaseRequest, DeviceID: this.DeviceID };
    const submit_data = {
      BaseRequest: this.BaseRequest,
      SyncKey: this.SyncKey,
      rr: ~new Date()
    };
    req
      .http({
        type: "POST",
        url: this.stateUrl,
        data: JSON.stringify(submit_data)
      })
      .then((data: string | object) => {
        data = JSON.parse(data as string);
        this.SyncKey = data["SyncCheckKey"];
        this.port_Examples.onReceiveDynamic(data as object);
      });
  }
}
