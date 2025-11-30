import Button from "../../../public/components/Button";
import ChooseGameTimePopUp from "./ChooseGameTimePopUp";
import { useState } from "react";
import timeIconBlack from "icons/eh-time-black.svg";
import timeIconWhite from "icons/eh-time-white.svg";
import { useGameTime } from "../../../context/gameTime/useGameTime";
import "../../scss/chooseMain.scss";

const ChooseGameTime = () => {
  const timer = useGameTime();
  const [changeGameTimePopUp, setChangeGameTimePopUp] =
    useState<boolean>(false);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} ${minutes === 1 ? "Minute" : "Minuten"}`;
  };

  return (
    <div className="player-selection">
      <Button
        content={
          timer.playerOneTime !== null || timer.playerTwoTime !== null
            ? ` ${formatTime(timer.playerOneTime)}`
            : `Zeit ändern`
        }
        onClick={() => {
          setChangeGameTimePopUp(true);
        }}
        svgImg={timeIconBlack}
        hoverSvgImg={timeIconWhite}
      />

      {changeGameTimePopUp && (
        <ChooseGameTimePopUp setChangeGameTimePopUp={setChangeGameTimePopUp} />
      )}
    </div>
  );
};

export default ChooseGameTime;
