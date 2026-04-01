require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const cookie = require('@fastify/cookie');
const jwt = require('@fastify/jwt');
const multipart = require('@fastify/multipart');
const bcrypt = require('bcryptjs');
const { prisma } = require('./db');
const fs = require('fs');

const util = require('util');
const { pipeline } = require('stream');
const pump = util.promisify(pipeline);
const fastifyStatic = require("@fastify/static");
const path = require("path");

fastify.register(fastifyStatic, {
    root: path.join(__dirname, "../client/dist"),
    prefix: "/",
});

fastify.setNotFoundHandler((request, reply) => {
    if (request.raw.url.startsWith('/api')) {
        return reply.code(404).send({
            success: false,
            message: 'API route not found'
        });
    }

    // SPA fallback
    return reply.sendFile('index.html');
});

// --- Plugins ---
fastify.register(cors, { origin: true, credentials: true });
fastify.register(cookie, { secret: process.env.COOKIE_SECRET || "super-secret", hook: 'onRequest' });
fastify.register(jwt, { secret: process.env.JWT_SECRET || 'super-jwt-key' });
fastify.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });

// --- Auth Decorator ---
fastify.decorate("authenticate", async function (request, reply) {
  try {
    const token = request.cookies.token || request.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new Error('Token missing');
    const decoded = fastify.jwt.verify(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) throw new Error('User not found');
    request.user = user;
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized', message: err.message });
  }
});

// --- Auth Routes ---
fastify.post('/api/auth/register', async (request, reply) => {
  const { name, email, password, role } = request.body;
  if (!email || !password || !name) return reply.code(400).send({ error: 'Missing required fields' });
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return reply.code(400).send({ error: 'Email already exists' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: role || 'USER' }
  });

  const token = fastify.jwt.sign({ id: user.id, role: user.role }, { expiresIn: '30d' });
  reply.setCookie('token', token, { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 2592000 });
  
  await prisma.activityLog.create({ data: { userId: user.id, action: 'Registered new account', entityType: 'Auth' } });
  return { success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
});

fastify.post('/api/auth/login', async (request, reply) => {
  const { email, password } = request.body;
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }

  const token = fastify.jwt.sign({ id: user.id, role: user.role }, { expiresIn: '30d' });
  reply.setCookie('token', token, { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 2592000 });
  
  // Log Activity
  await prisma.activityLog.create({ data: { userId: user.id, action: 'Logged in', entityType: 'Auth' } });
  
  return { success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
});

fastify.get('/api/auth/me', { preValidation: [fastify.authenticate] }, async (request, reply) => {
  return { user: { id: request.user.id, name: request.user.name, email: request.user.email, role: request.user.role } };
});

fastify.post('/api/auth/logout', async (request, reply) => {
  reply.clearCookie('token', { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
  return { success: true };
});

// --- Dashboard APIs ---
fastify.get('/api/dashboard/kpis', { preValidation: [fastify.authenticate] }, async (request, reply) => {
  const myParts = await prisma.part.count({ where: { ownerId: request.user.id } });
  const pendingApprovals = await prisma.changeOrder.count({ where: { status: 'PENDING' } });
  const activeChanges = await prisma.changeOrder.count({ where: { status: { in: ['PENDING', 'REVIEW'] } } });
  return { myParts, pendingApprovals, activeChanges };
});

fastify.get('/api/dashboard/recents', { preValidation: [fastify.authenticate] }, async (request, reply) => {
  return await prisma.part.findMany({ take: 5, orderBy: { updatedAt: 'desc' } });
});

fastify.get('/api/dashboard/activity', { preValidation: [fastify.authenticate] }, async (request, reply) => {
  return await prisma.activityLog.findMany({ 
    take: 10, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } }
  });
});

// --- Assembly & Parts APIs ---
fastify.get('/api/parts', { preValidation: [fastify.authenticate] }, async (request, reply) => {
  return await prisma.part.findMany({});
});

// Recursive BOM fetch (simplified 1-level for brevity, in production use CTEs)
fastify.get('/api/parts/:id/bom', { preValidation: [fastify.authenticate] }, async (request, reply) => {
  const rootPart = await prisma.part.findUnique({ where: { id: parseInt(request.params.id) } });
  if (!rootPart) return reply.code(404).send({ error: 'Part not found' });
  
  const children = await prisma.bomItem.findMany({
    where: { parentPartId: rootPart.id },
    include: { childPart: true }
  });
  
  return { ...rootPart, children: children.map(c => ({ ...c.childPart, qty: c.quantity })) };
});

fastify.get('/api/parts/:id/history', { preValidation: [fastify.authenticate] }, async (request, reply) => {
  return await prisma.revision.findMany({ where: { partId: parseInt(request.params.id) }, orderBy: { createdAt: 'desc' }});
});

// --- ECO / Change Orders APIs ---
fastify.post('/api/changes', { preValidation: [fastify.authenticate] }, async (request, reply) => {
  const { partId, title, description, priority } = request.body;
  
  if (!partId || !title || !description) return reply.code(400).send({ error: 'Missing required fields' });
  
  // Create ECN tracking
  const timestamp = Date.now().toString().slice(-4);
  const newEcn = await prisma.changeOrder.create({
    data: {
      ecnNumber: `ECN-20${timestamp}`,
      targetPartId: parseInt(partId),
      title,
      description,
      priority: priority.toUpperCase(),
      status: 'PENDING',
      createdBy: request.user.id
    },
    include: { targetPart: true }
  });

  await prisma.activityLog.create({
    data: { userId: request.user.id, action: `Raised new ECN ${newEcn.ecnNumber}`, entityType: 'ECN', entityId: newEcn.id }
  });

  return newEcn;
});

fastify.get('/api/changes/kanban', { preValidation: [fastify.authenticate] }, async (request, reply) => {
  const orders = await prisma.changeOrder.findMany({ include: { targetPart: true } });
  const kanban = { pending: [], review: [], approved: [], rejected: [] };
  orders.forEach(o => {
    kanban[o.status.toLowerCase()].push({
      id: o.ecnNumber, dbId: o.id, p: o.targetPart.partNumber, r: o.targetPart.currentRev, pri: o.priority, msg: o.title
    });
  });
  return kanban;
});

// Kanban Drag and Drop Status Update
fastify.put('/api/changes/:id/status', { preValidation: [fastify.authenticate] }, async (request, reply) => {
  const { status } = request.body;
  const order = await prisma.changeOrder.update({
    where: { ecnNumber: request.params.id }, data: { status: status.toUpperCase() }
  });
  await prisma.activityLog.create({ data: { userId: request.user.id, action: `Moved ${order.ecnNumber} to ${status}`, entityType: 'ECN', entityId: order.id } });
  return order;
});

// Release stamp
fastify.post('/api/changes/:id/release', { preValidation: [fastify.authenticate] }, async (request, reply) => {
  const order = await prisma.changeOrder.findUnique({ where: { ecnNumber: request.params.id } });
  if (!order) return reply.code(404).send({ error: 'Not found' });
  
  const updatedPart = await prisma.part.update({
    where: { id: order.targetPartId }, data: { status: 'RELEASED', isLocked: true }
  });
  
  await prisma.revision.create({
    data: { partId: updatedPart.id, revString: updatedPart.currentRev, pushedBy: request.user.name, changes: order.description }
  });

  await prisma.changeOrder.update({ where: { id: order.id }, data: { status: 'APPROVED' }});

  return { success: true, part: updatedPart };
});

// --- Admin APIs ---
fastify.get('/api/admin/users', { preValidation: [fastify.authenticate] }, async (request, reply) => {
  if (request.user.role !== 'ADMIN') return reply.code(403).send({ error: 'Forbidden' });
  return await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, department: true, status: true } });
});


// --- New Extended APIs ---
fastify.put('/api/auth/profile', { preValidation: [fastify.authenticate] }, async (request, reply) => {
  const { name, department } = request.body;
  const updated = await prisma.user.update({
    where: { id: request.user.id },
    data: { name, department }
  });
  return { success: true, user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role, department: updated.department } };
});

fastify.post('/api/files', { preValidation: [fastify.authenticate] }, async (request, reply) => {
  const parts = request.parts(); // multipart iterator
  let partId = null;
  let savedFiles = [];

  for await (const part of parts) {
    if (part.type === 'file') {
      const fileName = `${Date.now()}-${part.filename}`;
      const saveTo = path.join(__dirname, '..', 'uploads', fileName);
      await pump(part.file, fs.createWriteStream(saveTo));
      
      const stat = fs.statSync(saveTo);
      savedFiles.push({ fileName: part.filename, sizeBytes: stat.size, url: `/uploads/${fileName}` });
    } else if (part.type === 'field' && part.fieldname === 'partId') {
      partId = parseInt(part.value);
    }
  }

  // If no parts passed, fallback to 0 or null
  if (!partId) return reply.code(400).send({ error: 'partId is required for upload' });

  for (let file of savedFiles) {
    await prisma.fileAsset.create({
      data: {
        partId,
        fileName: file.fileName,
        sizeBytes: file.sizeBytes,
        url: file.url,
        uploadedById: request.user.id
      }
    });

    await prisma.activityLog.create({
      data: { userId: request.user.id, action: `Uploaded file ${file.fileName}`, entityType: 'FileAsset' }
    });
  }

  return { success: true, files: savedFiles };
});

fastify.get('/api/files', { preValidation: [fastify.authenticate] }, async (request, reply) => {
  return await prisma.fileAsset.findMany({ include: { part: true, lockedBy: { select: { name: true } } } });
});

fastify.get('/api/impact/:partId', { preValidation: [fastify.authenticate] }, async (request, reply) => {
  // Simple where-used dependency mapping logic
  const part = await prisma.part.findUnique({ where: { id: parseInt(request.params.partId) }, include: { parentBoms: { include: { parentPart: true } } } });
  if (!part) return reply.code(404).send({ error: "Part not found" });
  
  // Transform into AI Insight format
  const insights = part.parentBoms.map(b => ({
    id: b.id, risk: b.parentPart.status === 'RELEASED' ? 'high' : 'low',
    msg: `Will invalidate "${b.parentPart.partNumber}" (${b.parentPart.name}) which is actively in ${b.parentPart.status}.`
  }));
  return { part, insights };
});

fastify.get('/api/admin/system', { preValidation: [fastify.authenticate] }, async (request, reply) => {
  if (request.user.role !== 'ADMIN') return reply.code(403).send({ error: 'Forbidden' });
  const [userCount, partCount, ecnCount] = await Promise.all([
    prisma.user.count(), prisma.part.count(), prisma.changeOrder.count()
  ]);
  return { users: userCount, parts: partCount, ecns: ecnCount };
});

const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 4000, host: '0.0.0.0' });
    fastify.log.info(`Server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
