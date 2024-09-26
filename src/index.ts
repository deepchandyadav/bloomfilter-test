import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import dotenv from "dotenv";
import path from 'path';
import { env } from './utils';
import { createClient } from 'redis';
import knex from 'knex';

dotenv.config({ path: path.resolve(__dirname, "../", ".env") });

const app = new Hono();

const redisClient = createClient({
  database: 1,
  url: env("REDIS_URL")
}).connect();

const postgresPool = knex({
  client: "pg",
  connection: {
    host: env("PG_HOST"),
    user: env("PG_USER"),
    password: env("PG_PASSWORD")
  }
})

const BF_KEY = "BF:users";

Promise.all([redisClient, postgresPool]).then(async ([redis, pg]) => {

  if (! await redis.exists(BF_KEY)) {
    console.log("creating Bloom filter key");
    await redis.bf.reserve(BF_KEY, 0.01, 1000);
  }


  const addUser = async (username: string, email: string) => {
    const user = pg.insert({ username, email }).into("users");
    await addHashCode(email);
    return user;
  }

  const addHashCode = async (email: string) => {
    await redis.bf.add(BF_KEY, email);
  }

  const addHashCodeMultiple = async (data: Array<Record<string, any>>, keyName: string) => {
    const rdata: string[] = data.map(d => d[keyName]);
    await redis.bf.mAdd(BF_KEY, rdata);
  }

  app.get("/add-existing", async (c) => {
    const users = await pg.select().from("users");
    await addHashCodeMultiple(users, "email");
    return c.text("added");
  })

  app.get('/add-user', async (c) => {

    const un = c.req.query("username");
    const em = c.req.query("email");

    if (!un || !em) {
      return c.text("Username or email not provided", 400);
    }

    const userEx = await redis.bf.exists(BF_KEY, em);

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
