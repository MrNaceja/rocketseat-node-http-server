import { IncomingMessage, Server, ServerResponse } from 'node:http';
import { Middleware } from './middleware.js';

export class Json extends Middleware {

    /**
     * @param {IncomingMessage} req 
     * @param {ServerResponse} res 
     * @param {Server<IncomingMessage, ServerResponse>} server 
     * @return {Promise<ServerResponse>}
     */
    async execute(req, res) {
        const buffer = []

        for await (const chunk of req) {
            buffer.push(chunk)
        }

        try {
            req.body = JSON.parse(Buffer.concat(buffer).toString())
        }
        catch (e) {
            req.body = null
        }

        res.setHeader('Content-Type', 'application/json')
    }
}