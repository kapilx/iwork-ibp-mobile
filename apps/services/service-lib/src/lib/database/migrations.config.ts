import { DataSource } from "typeorm";

import * as path from 'path';
import * as dotenv from 'dotenv';

const envFile = path.resolve(process.cwd(),
  '../../../environments/.env.' + (process.env.NODE_ENV || 'dev')
);
   
dotenv.config({ path: envFile });
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities:["../entities/*.entity{.ts,.js}"],
  migrations: [path.join(process.cwd(), 'src/migrations/*.ts')],
  synchronize: false,
});


