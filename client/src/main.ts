import { initEngine } from './game/engine';
import { connectToServer } from './network/colyseus';

async function bootstrap() {
  await initEngine();
  await connectToServer();
  console.log("🚀 Game successfully bootstrapped!");
}

bootstrap();
