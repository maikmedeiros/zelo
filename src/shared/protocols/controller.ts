import { IHttpRequest, IHttpResponse } from './http.js';

export interface IController<Req extends IHttpRequest = IHttpRequest, Res = unknown> {
  handle(request: Req): Promise<IHttpResponse<Res>> | IHttpResponse<Res>;
}
