import http from 'node:http'
import { Router } from './middlewares/router.js'
import { Database } from './database/database.js'
import { randomUUID } from 'node:crypto'

const db = new Database()
const router = new Router()

router.GET('/users', async (req, res) => {
    /** @type {URLSearchParams} */
    const query_params = req.query

    const filterable_fields = ['name', 'email']

    const where_filters = query_params.entries().reduce((filters, [ field_filter, field_value ]) => {
        if ( filterable_fields.includes(field_filter) ) {
            if ( !filters ) filters = {}

            filters[field_filter] = {
                operator: 'IN',
                condition: 'OR',
                value: field_value
            }
        };

        return filters
    }, undefined)

    const users = await db.select('users', where_filters)
    res.writeHead(200).end(JSON.stringify(users))
})

router.DELETE('/users/:id', async (req, res) => {
    const { id } = req.params
    await db.delete('users', { id: { value: id } })
    return res.writeHead(204).end()
})

router.PUT('/users/:id', async (req, res) => {
    const { id } = req.params
    const payload = req.body

    await db.update('users', payload, { id: { value: id } })
    return res.writeHead(204).end()
})

router.POST('/users', async (req, res) => {
    const { name, email } = req.body
    const new_user = { 
        id: randomUUID(),
        name,
        email
    }
    await db.insert('users', new_user)
    return res.writeHead(201).end(JSON.stringify({ id: new_user.id }))
})

const server = http.createServer(async (req, res) => router.execute(req, res, server))

server.listen(3000, () => {
    console.log('Servidor HTTP rodando em http://localhost:3000 🚀')
})