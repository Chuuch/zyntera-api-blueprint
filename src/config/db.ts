/**
 * MySQL connection pool and Drizzle ORM client (`db`).
 */
import { drizzle } from "drizzle-orm/mysql2";
import mysql from 'mysql2/promise';
import * as schema from '../models/schema.js';
import { logger } from './logger.js';

const poolConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true, // Wait for a connection to be available
    connectionLimit: 20,      // Max conns in the pool
    maxIdle: 10,              // Max idle conns the reset are closed
    idleTimeout: 60000,       // Idle conns timeout in milliseconds
    queueLimit: 0,            // No limit on the number of connection requests in queue
    enableKeepAlive: true,    // Keep conns alive to avoid TCP handshake overhead
    keepAliveInitialDelay: 0, // Initial delay in milliseconds before sending keep-alive probes
    connectionTimeout: 10000, // Fail if it takes >10s to connect
}

const pool = mysql.createPool(poolConfig);

pool.getConnection()
    .then(conn => {
        logger.info('Connected to the database');
        conn.release();
    })
    .catch(err => {
        logger.error('Failed to connect to the database', err);
        process.exit(1);
    });

/**
 * Drizzle database client bound to the shared pool and `models/schema` tables.
 */
export const db = drizzle(pool, { schema, mode: 'default' });