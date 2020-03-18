import request from "request";
import fs from "fs";

export class Req {
  private _jar: request.CookieJar = request.jar();
  cookiesParse(url: string) {
    const cookiesParse = {};
    this._jar
      .getCookies(url)
      .forEach(ele => (cookiesParse[ele["key"]] = ele["value"]));
    return {
      parse: cookiesParse,
      toString: this._jar.getCookieString(url)
    };
  }
  http({ url = "", type = "GET", data = "", headers = {}, params = {} }) {
    const options = {
      url,
      method: type,
      charset: "utf-8",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.93 Safari/537.36",
        ...headers
      },
      body: data,
      jar: this._jar,
      ...params
    };
    return new Promise((resolve, reject) => {
      request(options, function(error, response, conent) {
        if (error) {
          reject(error);
        } else {
          resolve(conent);
        }
      });
    });
  }
  download(url: string, fileName: string) {
    const options = {
      url,
      charset: "utf-8",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.93 Safari/537.36"
      },
      jar: this._jar
    };
    return new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(fileName);
      request(options)
        .pipe(stream)
        .on("close", function(error, response, conent) {
          error ? reject(error) : resolve();
        });
    });
  }
}

export const req = new Req();
