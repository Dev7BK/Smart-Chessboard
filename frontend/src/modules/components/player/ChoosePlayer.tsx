import { usePlayer } from "../../../context/playerContext/usePlayer";
import Button from "../../../public/components/Button";
import ChoosePlayerPopUp from "./ChoosePlayerPopUp";
import { useState } from "react";
import "../../scss/chooseMain.scss";
import playerIconBlack from "icons/eh-user-black.svg";
import playerIconWhite from "icons/eh-user-white.svg";

const ChoosePlayer = () => {
  const { blackPlayer, whitePlayer } = usePlayer();
  const [isPlayerOne, setIsPlayerOne] = useState<boolean | null>(true);
  const [changePlayerPopUp, setChangePlayerPopUp] = useState<boolean>(false);

  const arePlayersChosen =
    whitePlayer !== "Nicht ausgewählt" && blackPlayer !== "Nicht ausgewählt";

  return (
    <div className="player-selection">
      <h2 className="player-name">{blackPlayer}</h2>
      <h2 className="vs-text">vs</h2>
      <h2 className="player-name">{whitePlayer}</h2>

      <Button
        content={arePlayersChosen ? "Spieler wechseln" : "Spieler wählen"}
        onClick={() => {
          setChangePlayerPopUp(true);
          setIsPlayerOne(true);
        }}
        svgImg={playerIconBlack}
        hoverSvgImg={playerIconWhite}
      />

      {changePlayerPopUp && (
        <ChoosePlayerPopUp
          setChangePlayerPopUp={setChangePlayerPopUp}
          isPlayerOne={isPlayerOne}
          setIsPlayerOne={setIsPlayerOne}
        />
      )}
    </div>
  );
};

export default ChoosePlayer;
