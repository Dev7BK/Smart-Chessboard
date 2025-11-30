import "../../scss/timer/chooseGameTimePopUp.scss";
import closeWhiteIcon from "icons/eh-cancel-white.svg";
import timeIconWhite from "icons/eh-time-white.svg";
import { useGameTime } from "../../../context/gameTime/useGameTime";
import { useState, useEffect } from "react";

type ChooseGameTimePopUpProps = {
  setChangeGameTimePopUp: (value: boolean) => void;
};
const TIME_OPTIONS = [3, 5, 10, 15, 30, 60, 90];

const ChooseGameTimePopUp = ({
  setChangeGameTimePopUp,
}: ChooseGameTimePopUpProps) => {
  const timer = useGameTime();
  const [customMinutes, setCustomMinutes] = useState<string>("");
  const [lastSelectedTime, setLastSelectedTime] = useState<number>(10);

  useEffect(() => {
    const currentMinutes = Math.floor(timer.playerOneTime / 60);
    if (TIME_OPTIONS.includes(currentMinutes)) {
      setLastSelectedTime(currentMinutes);
    }
  }, [timer.playerOneTime]);

  const handleTimeSelect = (minutes: number) => {
    timer.setGameTime(minutes);
    setLastSelectedTime(minutes);
    setChangeGameTimePopUp(false);
  };

  const handleCustomTimeSubmit = () => {
    const minutes = Number.parseInt(customMinutes);
    if (!Number.isNaN(minutes) && minutes > 0) {
      timer.setGameTime(minutes);
      setLastSelectedTime(minutes);
      setChangeGameTimePopUp(false);
    }
  };

  const handleCustomTimeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCustomTimeSubmit();
    }
  };

  const handleCancel = () => {
    setChangeGameTimePopUp(false);
  };

  return (
    <div className="choose-player-primary-div">
      <div className="choose-player-secondary-div">
        <div className="popup-header">
          <div className="title-box">
            <img src={timeIconWhite} alt="Zeit" className="time-icon-header" />
            <h2 className="popup-title">Zeit auswählen</h2>
          </div>
          <button className="close-button-header" onClick={handleCancel}>
            <img
              src={closeWhiteIcon}
              alt="Schließen"
              className="close-icon-header"
            />
          </button>
        </div>

        <div className="player-selection-buttons">
          {TIME_OPTIONS.map((timeOption) => (
            <div key={timeOption} className="player-row">
              <button
                className={`choose-player-base-button choose-player ${
                  lastSelectedTime === timeOption ? "selected" : ""
                }`}
                onClick={() => handleTimeSelect(timeOption)}
              >
                {timeOption} {timeOption === 1 ? "Minute" : "Minuten"}
              </button>
            </div>
          ))}
        </div>

        <div className="player-row">
          <div className="custom-time-input">
            <input
              type="number"
              placeholder="Eingabe..."
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              onKeyDown={handleCustomTimeKeyPress}
              min="1"
              max="999"
              className="custom-minutes-input"
            />
            <button
              className="choose-player-base-button submit-custom"
              onClick={handleCustomTimeSubmit}
              disabled={!customMinutes || Number.parseInt(customMinutes) <= 0}
            >
              Setzen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChooseGameTimePopUp;
