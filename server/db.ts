import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { loadEnv } from 'vite'; 
import 'dotenv/config';

// Use WebSocket for NeonDB connections
neonConfig.webSocketConstructor = ws;

// if (!process.env.DATABASE_URL) {
//   throw new Error(
//     "DATABASE_URL must be set. Did you forget to provision a database?",
//   );
// }
// process.env = {...process.env, ...loadEnv(mode, process.cwd())};
console.log(process.env.DATABASE_URL);  

export const pool = new Pool({ connectionString: process.env.DATABASE_URL  });
export const db = drizzle(pool, { schema });