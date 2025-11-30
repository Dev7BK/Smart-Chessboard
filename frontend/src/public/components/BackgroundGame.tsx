import { JSX } from "react";
import "../scss/backgroundGame.scss";

type BackgroundProps = {
  children: JSX.Element;
};

const BackgroundGame = ({ children }: BackgroundProps) => {
  return (
    <div className="game-primary-div">
      <div className="game-secondary-first-div"></div>
      <div className="game-secondary-second-div">{children}</div>
    </div>
  );
};

export default BackgroundGame;
