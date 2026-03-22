// custom-reuse.strategy.ts
import { RouteReuseStrategy, DetachedRouteHandle, ActivatedRouteSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';

@Injectable()
export class CustomReuseStrategy implements RouteReuseStrategy {
  private stored = new Map<string, DetachedRouteHandle>();

  // decide whether to detach route (store it)
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // customize: detach only for certain routes (by path, data flag, etc.)
    return !!route.routeConfig && !!route.routeConfig.data && route.routeConfig.data['reuse'];
  }

  // store the detached handle
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    if (!route.routeConfig) return;
    const key = this.getKey(route);
    if (handle) this.stored.set(key, handle);
  }

  // decide whether to reattach route
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const key = this.getKey(route);
    return this.stored.has(key);
  }

  // return the stored handle
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    if (!route.routeConfig) return null;
    const key = this.getKey(route);
    return this.stored.get(key) ?? null;
  }

  // reuse if route config is same
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  private getKey(route: ActivatedRouteSnapshot): string {
    // build a key that identifies the route instance (customize if params matter)
    return route.routeConfig ? route.routeConfig.path || '' : '';
  }
}
