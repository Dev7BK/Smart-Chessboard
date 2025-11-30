import "../../index.scss";
import BackgroundMain from "../../public/components/BackgroundMain";
import BackgroundGame from "../../public/components/BackgroundGame";
import ChessBoard from "../../public/components/ChessBoard";
import GameInfo from "../../modules/Windows/GameInfo";
import StartGameMenu from "../../modules/Windows/StartGameMenu";
import Notification from "../../public/components/Notification";
import { useGameInfo } from "../../context/gameInfo/useGameInfo";

const GameLayout = () => {
  const { gameStarted } = useGameInfo();

  return (
    <div className="grid-container">
      <div className="chessboard-primary-div">
        <ChessBoard />
      </div>

      <div className="game-start-info-div">
        <BackgroundMain>
          {gameStarted ? (
            <BackgroundGame>
              <GameInfo />
            </BackgroundGame>
          ) : (
            <StartGameMenu />
          )}
        </BackgroundMain>
      </div>

      <Notification />
    </div>
  );
};

export default GameLayout;
