import postgres from 'postgres';

export const db = postgres(process.env.MAIN_DB || '');
