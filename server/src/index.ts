import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { SymbleRoom } from "./rooms/SymbleRoom";

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({
    server
  })
});

gameServer.define('symble', SymbleRoom);

gameServer.listen(port).then(() => {
  console.log(`🚀 Symble Colyseus Server is listening on ws://localhost:${port}`);
});
