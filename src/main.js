import Fastify from 'fastify'
import FastifLevelDB from '@fastify/leveldb';

const fastify = Fastify({
  logger: true
})
fastify.register(FastifLevelDB, {
  name: 'orders',
  path: '.tmp/data/db'
});

fastify.get('/v1/orders', async function (request, reply) {
  let result = [];
  for await (const [_, order] of this.level.orders.iterator()) {
    result.push(JSON.parse(order))
  }

  reply.send(result);
})

fastify.post('/v1/orders', async function (request, reply) {
  const id = crypto.randomUUID()
  const { name, address, zip_code } = request.body;
  const result = { id, name, address, zip_code, status: "CREATED" };
  await this.level.orders.put(id, JSON.stringify(result))
  reply.code(201).send(result);
})

fastify.get('/v1/orders/:id', async function (request, reply) {
  const result = await this.level.orders.get(request.params.id);
  reply.send(JSON.parse(result));
})

fastify.put('/v1/orders/:id', async function (request, reply) {
  const { id } = request.params;
  const { name, address, zip_code } = request.body;
  const order = JSON.parse(await this.level.orders.get(id));
  const result = {
    id,
    name: name || order.name,
    address: address || order.address,
    zip_code: zip_code || order.zip_code,
    status: order.status
  };
  await this.level.orders.put(id, JSON.stringify(result))
  reply.send(result);
})

fastify.delete('/v1/orders/:id', async function (request, reply) {
  const { id } = request.params;
  await this.level.orders.del(id);
  reply.send();
})

fastify.put('/v1/orders/:id/status', async function (request, reply) {
  const { id } = request.params;
  const { status } = request.body;
  const order = JSON.parse(await this.level.orders.get(id));
  const result = {
    ...order,
    status
  };
  await this.level.orders.put(id, JSON.stringify(result))
  reply.send();
})

fastify.get('/v1/trackings/:id', async function (request, reply) {
  const { id } = request.params;
  const { status } = JSON.parse(await this.level.orders.get(id));
  const result = { status };
  reply.send(result);
})

/**
 * Run the server!
 */
const start = async () => {
  try {
    await fastify.listen({ port: 8080 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
