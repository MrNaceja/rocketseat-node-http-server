import { IncomingMessage, Server, ServerResponse } from 'node:http';
import { Middleware } from './middleware.js';
import { Json } from './json.js'

const json_middleware = new Json()

const ROUTE_PARAMS_GROUP_REGEX = /:([a-zA-Z]+)/g
const ROUTE_PARAMS_REGEX       = '(?<$1>[a-z0-9\-_]+)'
const ROUTE_QUERY_REGEX        = '(\\?.*)?'

export class Router extends Middleware {
    #routes = new Map()

    /**
     * @param {IncomingMessage} req 
     * @param {ServerResponse} res 
     * @param {Server<IncomingMessage, ServerResponse>} server 
     * @return {Promise<ServerResponse>}
     */
    async execute(req, res, server) {
        const { method, url } = req
        console.info(`${method}: ${url}`)
        await json_middleware.execute(req, res);

        for (const [route_method, routes_on_method] of this.#routes.entries()) {

            const has_route_on_method = route_method == method

            for (const [ [ route_path, route_handler ] ] of routes_on_method) {
                const has_route_on_path = route_path.test(url)

                if ( has_route_on_method && has_route_on_path) {
                    const { groups } = url.match(route_path)
                    req.params = { ...groups }
                    const { address, port } = server.address()
                    const host = address === '::' ? 'localhost' : address
                    const server_url = new URL(`http://${host}:${port}/${url}`)
                    req.query = server_url.searchParams
                    return route_handler(req, res)
                }
            }

        }
        return res.writeHead(404).end('NOT FOUND')
    }

    #buildRoutePath(path) {
        return new RegExp(`^${path.replaceAll(ROUTE_PARAMS_GROUP_REGEX, ROUTE_PARAMS_REGEX)}${ROUTE_QUERY_REGEX}$`)
    }

    #addRoute(method, path, handler) {
        method = method.toUpperCase()

        if ( !this.#routes.has(method) ) {
            this.#routes.set(method, [])
        }
        
        this.#routes.get(method).push([ [ this.#buildRoutePath(path), handler ] ])
    }

    GET(path, handler) {
        this.#addRoute('GET', path, handler)
    }
    POST(path, handler) {
        this.#addRoute('POST', path, handler)
    }
    PUT(path, handler) {
        this.#addRoute('PUT', path, handler)
    }
    PATH(path, handler) {
        this.#addRoute('PATH', path, handler)
    }
    DELETE(path, handler) {
        this.#addRoute('DELETE', path, handler)
    }
}