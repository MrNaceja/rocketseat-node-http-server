import fs from 'node:fs/promises'

const STORAGE_FILE = 'storage.json'
const storage_file_path = new URL(`../database/${STORAGE_FILE}`, import.meta.url)

export class Database {
    #storage = new Map()

    constructor() {
        this.#syncStorage()
    }

    async #syncStorage() {
        try {
            const file_data = await fs.readFile(storage_file_path, 'utf-8')
            const storage_json = JSON.parse(file_data)
            Object.entries(storage_json).forEach(([ table, data ]) => {
                this.#storage.set(table, data)
            })
        }
        catch (e) {
            await this.#persistStorage()
        }
    }

    async #persistStorage() {
        try {
            const storage_data = Object.fromEntries(this.#storage)
            fs.writeFile(storage_file_path, JSON.stringify(storage_data))
        }
        catch (e) {
            console.error('Database Persist Storage Error', e)
            throw e
        }
    }

    async select(table, where) {
        if ( !this.#storage.has(table) ) {
           this.#storage.set(table, [])
        }

        const rows = this.#storage.get(table)
        if ( !where ) return rows

        return rows.filter(row => {
            let should_show_row

            if ( where ) {
                for (const [ where_key, where_config ] of Object.entries(where)) {
                    const {
                        operator = '=', 
                        condition = 'AND', 
                        value
                    } = where_config

                    const where_operations = {
                        '='     : row[where_key] == value,
                        '>'     : row[where_key] > value,
                        '>='    : row[where_key] >= value,
                        '<'     : row[where_key] < value,
                        '<='    : row[where_key] <= value,
                        'IN'    : row[where_key].includes(value),
                        'NOT_IN': !row[where_key].includes(value),
                    }

                    if ( typeof(should_show_row) == 'undefined' ) {
                        should_show_row = where_operations[operator.toUpperCase()]
                        continue
                    }

                    switch (condition.toUpperCase()) {
                        case 'OR':
                            should_show_row = should_show_row || where_operations[operator.toUpperCase()]
                            continue
                        case 'AND':
                        default:
                            should_show_row = should_show_row && where_operations[operator.toUpperCase()]
                    }
                }
            }

            return should_show_row
        })
    }

    async insert(table, payload) {
        if ( !this.#storage.has(table) ) {
           this.#storage.set(table, [])
        }

        this.#storage.get(table).push(payload)
        this.#persistStorage();
    }

    async delete(table, where) {
        if ( !this.#storage.has(table) ) {
           this.#storage.set(table, [])
        }

        this.#storage.set(table, this.#storage.get(table).filter(row => {
            let should_keep_row 

            if ( where ) {
                for (const [ where_key, where_config ] of Object.entries(where)) {
                    const {
                        operator = '=', 
                        condition = 'AND', 
                        value
                    } = where_config

                    const where_operations = {
                        '='     : row[where_key] == value,
                        '>'     : row[where_key] > value,
                        '>='    : row[where_key] >= value,
                        '<'     : row[where_key] < value,
                        '<='    : row[where_key] <= value,
                        'IN'    : row[where_key].includes(value),
                        'NOT_IN': !row[where_key].includes(value),
                    }

                    if ( typeof(should_keep_row) == 'undefined' ) {
                        should_keep_row = where_operations[operator.toUpperCase()]
                        continue
                    }

                    switch (condition.toUpperCase()) {
                        case 'OR':
                            should_keep_row = should_keep_row || where_operations[operator.toUpperCase()]
                            continue
                        case 'AND':
                        default:
                            should_keep_row = should_keep_row && where_operations[operator.toUpperCase()]
                    }
                }
            }
            else { // Se não fornecer filtro where deleta todos
                should_keep_row = false;
            }

            return !should_keep_row
        }))
        this.#persistStorage()
    }

    async update(table, payload, where) {
        if ( !this.#storage.has(table) ) {
           this.#storage.set(table, [])
        }

        this.#storage.set(table, this.#storage.get(table).map(row => {
            let should_update_row
            
            if ( where ) {
                for (const [ where_key, where_config ] of Object.entries(where)) {
                    const {
                        operator = '=', 
                        condition = 'AND', 
                        value
                    } = where_config

                    const where_operations = {
                        '='     : row[where_key] == value,
                        '>'     : row[where_key] > value,
                        '>='    : row[where_key] >= value,
                        '<'     : row[where_key] < value,
                        '<='    : row[where_key] <= value,
                        'IN'    : row[where_key].includes(value),
                        'NOT_IN': !row[where_key].includes(value),
                    }

                    if ( typeof(should_update_row) == 'undefined' ) {
                        should_update_row = where_operations[operator.toUpperCase()]
                        continue
                    }

                    switch (condition.toUpperCase()) {
                        case 'OR':
                            should_update_row = should_update_row || where_operations[operator.toUpperCase()]
                            continue
                        case 'AND':
                        default:
                            should_update_row = should_update_row && where_operations[operator.toUpperCase()]
                    }
                }   
            } 
            else { // Se não fornecer filtros então atualiza todos
                should_update_row = true;
            }
   
            if ( should_update_row ) {
                payload = Object.fromEntries(Object.entries(payload).filter(([ payload_key ]) => {
                    return Object.hasOwn(row, payload_key)
                }))
                return { ...row, ...payload } 
            }
            return row
        }))
        this.#persistStorage()
    }

}