import "./index.scss";
import { PlayerProvider } from "./context/playerContext/PlayerProvider";
import { GameTimeProvider } from "./context/gameTime/GameTimeProvider";
import { NotificationProvider } from "./context/notification/NotificationProvider";
import { GameInfoProvider } from "./context/gameInfo/GameInfoProvider";
import GameLayout from "./public/components/GameLayout";
import { LoaderProvider } from "./context/loading/LoaderProvider";
import LoadingOverlay from "./public/components/LoadingOverlay";

function App() {
  return (
    <LoaderProvider>
      <NotificationProvider>
        <PlayerProvider>
          <GameTimeProvider>
            <GameInfoProvider>
              <GameLayout />
              <LoadingOverlay />
            </GameInfoProvider>
          </GameTimeProvider>
        </PlayerProvider>
      </NotificationProvider>
    </LoaderProvider>
  );
}

export default App;
