import * as Colyseus from 'colyseus.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'ws://localhost:2567';
export const client = new Colyseus.Client(SERVER_URL);
export let currentRoom: Colyseus.Room | null = null;
let pingStart = 0;

export async function connectToServer() {
  try {
    currentRoom = await client.joinOrCreate('symble', { name: "Player " + Math.floor(Math.random() * 1000) });
    console.log("Joined room:", currentRoom.id);
    
    currentRoom.onStateChange((state) => {
      // Logic to sync Pixi.js renderer with state updates
    });

    currentRoom.onMessage("PONG", () => {
      const latency = Date.now() - pingStart;
      const pingElement = document.getElementById('ping-counter');
      if (pingElement) pingElement.innerText = latency.toString();
    });

    setInterval(() => {
      pingStart = Date.now();
      currentRoom?.send("PING");
    }, 1000);

    return currentRoom;
  } catch (e) {
    console.error("JOIN ERROR", e);
    throw e;
  }
}

export function sendMatchAttempt(symbolId: number) {
  if (currentRoom) {
    currentRoom.send("MATCH_ATTEMPT", { symbolId });
  }
}
