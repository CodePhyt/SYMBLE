import { Room, Client } from "colyseus";
import { GameState, PlayerSchema } from "./schema/GameState";
import { GAME_CONSTANTS, generateDeck } from "@symble/shared";
import { recordMatchHistory } from "../db/supabase";

const REFERENCE_DECK = generateDeck(GAME_CONSTANTS.ORDER);

export class SymbleRoom extends Room<GameState> {
  maxClients = GAME_CONSTANTS.MAX_PLAYERS;

  onCreate(options: any) {
    this.setState(new GameState());

    this.onMessage(GAME_CONSTANTS.EVENTS.MATCH_ATTEMPT, (client, message) => {
      this.handleMatchAttempt(client, message);
    });

    this.onMessage("START_GAME", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player && player.isHost && this.state.status === "LOBBY") {
        this.state.currentMode = message.mode || "AVALANCHE";
        this.startGame();
      }
    });

    this.onMessage("PING", (client) => {
      client.send("PONG");
    });

    console.log(`Room ${this.roomId} created.`);
  }

  onJoin(client: Client, options: any) {
    const isFirstPlayer = this.state.players.size === 0;
    const player = new PlayerSchema();
    player.id = options.userId || client.sessionId;
    player.sessionId = client.sessionId;
    player.name = options.name || `Player ${this.state.players.size + 1}`;
    player.isHost = isFirstPlayer;
    player.connected = true;
    this.state.players.set(client.sessionId, player);
  }

  async onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;
    player.connected = false;
    try {
      if (consented) throw new Error("Consented leave");
      await this.allowReconnection(client, 20);
      player.connected = true;
    } catch (e) {
      this.state.players.delete(client.sessionId);
      if (player.isHost && this.state.players.size > 0) {
        Array.from(this.state.players.values())[0].isHost = true;
      }
    }
  }

  private startGame() {
    this.state.status = "PLAYING";
    const deckIds = Array.from({ length: GAME_CONSTANTS.TOTAL_CARDS }, (_, i) => i);
    for (let i = deckIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deckIds[i], deckIds[j]] = [deckIds[j], deckIds[i]];
    }

    if (this.state.currentMode === "DRAIN") {
      const perPlayer = Math.floor((deckIds.length - 1) / this.state.players.size);
      this.state.players.forEach(p => { p.deck.clear(); for(let i=0; i<perPlayer; i++) p.deck.push(deckIds.pop()!); });
      this.state.centerDeck.clear();
      this.state.currentCenterCardId = deckIds.pop() ?? -1;
    } else if (this.state.currentMode === "TRIPLE_LOCK") {
      this.state.centerGrid.clear();
      for(let i=0; i<9; i++) this.state.centerGrid.push(deckIds.pop()!);
      this.state.players.forEach(p => { p.deck.clear(); p.deck.push(deckIds.pop()!); });
      this.state.centerDeck.clear();
      deckIds.forEach(id => this.state.centerDeck.push(id));
    } else {
      this.state.players.forEach((player) => { player.deck.clear(); player.deck.push(deckIds.pop()!); });
      this.state.centerDeck.clear();
      deckIds.forEach(id => this.state.centerDeck.push(id));
      this.state.currentCenterCardId = this.state.centerDeck.pop() ?? -1;
    }
  }

  private handleMatchAttempt(client: Client, message: any) {
    if (this.state.status !== "PLAYING") return;
    const player = this.state.players.get(client.sessionId);
    if (!player || player.deck.length === 0) return;
    switch (this.state.currentMode) {
      case "PASS_THE_CURSE": this.handlePassTheCurse(client, player, message); break;
      case "DRAIN": this.handleDrain(client, player, message); break;
      case "TRIPLE_LOCK": this.handleTripleLock(client, player, message); break;
      case "HOT_CARD": break;
      default:
      case "AVALANCHE": this.handleAvalanche(client, player, message); break;
    }
  }

  private handleAvalanche(client: Client, player: PlayerSchema, message: any) {
    const symbolId = message.symbolId;
    const playerCardId = player.deck[player.deck.length - 1];
    const centerCardId = this.state.currentCenterCardId;
    if (centerCardId === -1) return;
    const isValid = REFERENCE_DECK[playerCardId].includes(symbolId) && REFERENCE_DECK[centerCardId].includes(symbolId);
    if (isValid) {
      player.deck.push(centerCardId);
      if (this.state.centerDeck.length > 0) {
        this.state.currentCenterCardId = this.state.centerDeck.pop() ?? -1;
      } else { this.state.currentCenterCardId = -1; this.endGame(client.sessionId); }
      client.send(GAME_CONSTANTS.EVENTS.MATCH_SUCCESS);
    } else { client.send(GAME_CONSTANTS.EVENTS.MATCH_FAIL); }
  }

  private handleDrain(client: Client, player: PlayerSchema, message: any) {
    const symbolId = message.symbolId;
    const playerCardId = player.deck[player.deck.length - 1];
    const centerCardId = this.state.currentCenterCardId;
    const isValid = REFERENCE_DECK[playerCardId].includes(symbolId) && REFERENCE_DECK[centerCardId].includes(symbolId);
    if (isValid) {
      this.state.currentCenterCardId = player.deck.pop() ?? -1;
      client.send(GAME_CONSTANTS.EVENTS.MATCH_SUCCESS);
      if (player.deck.length === 0) this.endGame(client.sessionId);
    } else { client.send(GAME_CONSTANTS.EVENTS.MATCH_FAIL); }
  }

  private handlePassTheCurse(client: Client, player: PlayerSchema, message: any) {
    const targetPlayer = this.state.players.get(message.targetSessionId);
    if (!targetPlayer) return;
    const symbolId = message.symbolId;
    const playerCardId = player.deck[player.deck.length - 1];
    const targetCardId = targetPlayer.deck[targetPlayer.deck.length - 1];
    const isValid = REFERENCE_DECK[playerCardId].includes(symbolId) && REFERENCE_DECK[targetCardId].includes(symbolId);
    if (isValid) {
      while(player.deck.length > 0) targetPlayer.deck.push(player.deck.pop()!);
      client.send(GAME_CONSTANTS.EVENTS.MATCH_SUCCESS);
      if (player.deck.length === 0) this.endGame(client.sessionId);
    } else { client.send(GAME_CONSTANTS.EVENTS.MATCH_FAIL); }
  }

  private handleTripleLock(client: Client, player: PlayerSchema, message: any) {
    // Requires validating symbol on player card AND two grid cards
  }

  private async endGame(winnerSessionId: string) {
    this.state.status = "FINISHED";
    this.state.roundWinner = winnerSessionId;
    const playerIds = Array.from(this.state.players.values()).map(p => p.id);
    const winner = this.state.players.get(winnerSessionId);
    if (winner) await recordMatchHistory(winner.id, this.state.currentMode, playerIds);
    console.log(`[Colyseus] Game Over! Mode: ${this.state.currentMode} | Winner: ${winnerSessionId}`);
  }
}
