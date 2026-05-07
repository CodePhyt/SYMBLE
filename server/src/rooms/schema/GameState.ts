import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class PlayerSchema extends Schema {
  @type("string") id: string = "";
  @type("string") sessionId: string = "";
  @type("string") name: string = "";
  @type("number") score: number = 0;
  @type("boolean") isHost: boolean = false;
  @type("boolean") connected: boolean = true;
  
  @type(["number"]) deck = new ArraySchema<number>();
}

export class GameState extends Schema {
  @type("string") status: string = "LOBBY";
  @type("string") currentMode: string = "AVALANCHE";
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type(["number"]) centerDeck = new ArraySchema<number>();
  @type("number") currentCenterCardId: number = -1;
  @type(["number"]) centerGrid = new ArraySchema<number>();
  @type("string") roundWinner: string = "";
}
