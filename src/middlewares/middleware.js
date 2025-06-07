import { IncomingMessage, Server, ServerResponse } from 'node:http';

export class Middleware {
    /**
     * @param {IncomingMessage} req 
     * @param {ServerResponse} res 
     * @param {Server<IncomingMessage, ServerResponse>} server 
     * @return {Promise<ServerResponse>}
     */
    async execute(req, res, server) {}
}