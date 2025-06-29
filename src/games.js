
import { loadDb } from './config';

export class Games {
    async init() {
        this.db = await loadDb();
        this.conn = await this.db.connect();

        this.table = 'games';
    }

    async loadGames() {
        if (!this.db || !this.conn)
            throw new Error('Database not initialized. Please call init() first.');

        const response = await fetch('/games.parquet');
            await this.db.registerFileBuffer("games.parquet", new Uint8Array(await response.arrayBuffer()));


        await this.conn.query(`
            CREATE TABLE ${this.table} AS
                SELECT * 
                FROM read_parquet('games.parquet');
        `);

        
    }

    async query(sql) {
        if (!this.db || !this.conn)
            throw new Error('Database not initialized. Please call init() first.');

        let result = await this.conn.query(sql);
        return result.toArray().map(row => row.toJSON());
    }

    async test(limit = 10) {
        if (!this.db || !this.conn)
            throw new Error('Database not initialized. Please call init() first.');

        const sql = `
                SELECT * 
                FROM ${this.table}
                LIMIT ${limit}
            `;

        return await this.query(sql);
    }
}