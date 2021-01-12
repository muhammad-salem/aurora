import { Component, Input } from '@ibyar/api';
export class Router {

}

export interface RouterOptions {
    name?: string;
}

const ROUTER_DEFAULT_NAME = "ROUTER_DEFAULT_NAME";
const routerMap: Map<RouterOptions, Router> = new Map();

export function RouterConfig(opt: RouterOptions): Router {
    return (target: Router) => {
        opt.name ||= ROUTER_DEFAULT_NAME;
        routerMap.set(opt, target);
        return target;
    };
}

@Component({
    selector: 'route-outlet',
    template: `nothing to show.`
})
export class RouterOutlet {
    @Input()
    name: string;
}
