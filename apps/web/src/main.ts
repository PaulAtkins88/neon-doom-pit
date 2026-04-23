import './style.css';
import { Game } from './core/Game';
import { MultiplayerLobby } from './network/MultiplayerLobby';

/** Boots the Neon Doom Pit runtime. */
const game = new Game();
const lobby = new MultiplayerLobby(game);

game.start();
lobby.initialize();
