import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import pg from "pg";
import dotenv from "dotenv";
import path from 'path';
import { env } from './utils';
import { createClient } from 'redis';
dotenv.config({ path: path.resolve(__dirname, "../", ".env") });

const app = new Hono();


String.prototype.hashCode = function () {
  console.log(this);
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash;
}

const redisClient = createClient({
  database: 1,
  url: env("REDIS_URL")
}).connect();

const postgresPool = new pg.Pool({
  host: env("PG_HOST"),
  user: env("PG_USER"),
  password: env("PG_PASSWORD")
}).connect();

Promise.all([redisClient, postgresPool]).then(([redis, pg]) => {

  const addUser = async (username: string, email: string) => {
    const query = `INSERT INTO users (username, email) VALUES ($1, $2) returning *;`;
    const user = (await pg.query(query, [username, email])).rows[0];
    await addHashCode(email);
    return user;
  }

  const getBFKey = (data: string) => {
    const hashCode = data.hashCode().toString();
    return `bloomfilter:${hashCode.toString()}`;
  }

  const addHashCode = async (email: string) => {
    const key = getBFKey(email);
    await redis.set(key, 1);
  }

  app.get("/add-existing", async (c) => {
    const users = (await pg.query("select * from users;")).rows;
    await Promise.all(users.map(u => addHashCode(u.email)));
    return c.text("added");
  })

  app.get('/add-user', async (c) => {

    const un = c.req.query("username");
    const em = c.req.query("email");

    if (!un || !em) {
      return c.text("Username or email not provided", 400);
    }

    const bfKey = getBFKey(em);
    const userEx = await redis.exists(bfKey);

    if (userEx) {
      return c.text("user exists");
    }

    const user = await addUser(un, em);
    return c.json(user);


  })

})


const port = 3030;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
})
