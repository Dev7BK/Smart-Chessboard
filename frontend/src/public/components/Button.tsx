import { useState } from "react";
import "../scss/button.scss";

type ButtonProps = {
  content: string;
  onClick: () => void;
  svgImg?: string;
  hoverSvgImg?: string;
};

const Button = ({ content, onClick, svgImg, hoverSvgImg }: ButtonProps) => {
  const [currentIcon, setCurrentIcon] = useState(svgImg);

  return (
    <div className="btn-container">
      <button
        onClick={onClick}
        className="btn"
        onMouseEnter={() => hoverSvgImg && setCurrentIcon(hoverSvgImg)}
        onMouseLeave={() => setCurrentIcon(svgImg)}
      >
        {currentIcon && <img src={currentIcon} alt="Button Icon" />}
        {content}
      </button>
    </div>
  );
};

export default Button;
