import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable()
export class RuntimePrefixInterceptor implements HttpInterceptor {
  constructor(private runtime: RuntimeConfigService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const url = req.url || '';

    // If URL already absolute (http:// or https:// or //) or is an asset, leave it
    if (/^\s*https?:\/\//i.test(url) || /^\s*\/\//.test(url) || url.startsWith('assets/') || url.startsWith('./') || url.startsWith('../')) {
      return next.handle(req);
    }

    // Otherwise prefix with backendUrl
    const backend = (this.runtime && this.runtime.backendUrl) ? this.runtime.backendUrl.replace(/\/+$/, '') : '';
    if (!backend) {
      return next.handle(req);
    }

    const path = url.startsWith('/') ? url : `/${url}`;
    const newUrl = `${backend}${path}`;
    const cloned = req.clone({ url: newUrl });
    return next.handle(cloned);
  }
}
