import { JSX } from "react";
import "../scss/backgroundMain.scss";

type BackgroundProps = {
  children: JSX.Element;
};

const BackgroundMain = ({ children }: BackgroundProps) => {
  return (
    <div className="background-primary-div">
      <div className="background-secondary-first-div"></div>
      <div className="background-secondary-second-div">{children}</div>
    </div>
  );
};

export default BackgroundMain;
