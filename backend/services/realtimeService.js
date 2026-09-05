const clients = new Map();

export const addClient = (userId, response) => {
  const key = userId.toString();
  const userClients = clients.get(key) || new Set();
  userClients.add(response);
  clients.set(key, userClients);
  response.on("close", () => {
    userClients.delete(response);
    if (userClients.size === 0) clients.delete(key);
  });
};

export const publishToUser = (userId, event, payload) => {
  const userClients = clients.get(userId.toString());
  if (!userClients) return;
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  userClients.forEach((response) => response.write(message));
};

export const publishToUsers = (userIds, event, payload) => userIds.forEach((userId) => publishToUser(userId, event, payload));

export const heartbeat = () => clients.forEach((userClients) => userClients.forEach((response) => response.write(": heartbeat\n\n")));

setInterval(heartbeat, 25000).unref();