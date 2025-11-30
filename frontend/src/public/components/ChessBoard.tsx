import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
  JSX,
  useMemo,
} from "react";
import { useSpring, animated, to } from "@react-spring/web";
import { useNotification } from "../../context/notification/useNotification";
import { useGameInfo } from "../../context/gameInfo/useGameInfo";
import "../scss/chessBoard.scss";

import blackPawn from "chessPieces/black-pawn.svg";
import whitePawn from "chessPieces/white-pawn.svg";
import blackRook from "chessPieces/black-rook.svg";
import whiteRook from "chessPieces/white-rook.svg";
import blackKnight from "chessPieces/black-knight.svg";
import whiteKnight from "chessPieces/white-knight.svg";
import blackBishop from "chessPieces/black-bishop.svg";
import whiteBishop from "chessPieces/white-bishop.svg";
import blackQueen from "chessPieces/black-queen.svg";
import whiteQueen from "chessPieces/white-queen.svg";
import blackKing from "chessPieces/black-king.svg";
import whiteKing from "chessPieces/white-king.svg";

const pieces: Record<string, string> = {
  r: blackRook,
  n: blackKnight,
  b: blackBishop,
  q: blackQueen,
  k: blackKing,
  p: blackPawn,
  R: whiteRook,
  N: whiteKnight,
  B: whiteBishop,
  Q: whiteQueen,
  K: whiteKing,
  P: whitePawn,
};

const parseFen = (fen: string): string[][] => {
  const rows = fen.split(" ")[0].split("/");
  return rows.map((row) => {
    const parsedRow: string[] = [];
    for (const char of row) {
      if (Number.isFinite(Number(char))) {
        parsedRow.push(...new Array(Number(char)).fill(null));
      } else {
        parsedRow.push(char);
      }
    }
    return parsedRow;
  });
};

const getSquareName = (row: number, col: number): string =>
  String.fromCodePoint(97 + col) + (8 - row);

const isWhiteSquare = (row: number, col: number): boolean =>
  (row + col) % 2 === 0;

const getCastlingPartner = (
  square: string,
  board: string[][],
  validMoves: string[]
): string | null => {
  const row = 8 - Number.parseInt(square[1]);
  const col = square.codePointAt(0)! - 97;
  const currentPiece = board[row][col];

  if (
    !currentPiece ||
    (currentPiece.toLowerCase() !== "k" && currentPiece.toLowerCase() !== "r")
  ) {
    return null;
  }

  const isWhitePiece = currentPiece === currentPiece.toUpperCase();
  const expectedRow = isWhitePiece ? 7 : 0;

  if (row !== expectedRow) {
    return null;
  }

  const castlingMoves = validMoves.filter((move) => {
    const moveRow = 8 - Number.parseInt(move[1]);
    const moveCol = move.codePointAt(0)! - 97;

    if (currentPiece.toLowerCase() === "k") {
      return moveRow === expectedRow && Math.abs(moveCol - col) === 2;
    }

    if (currentPiece.toLowerCase() === "r") {
      const kingCol = 4;

      return validMoves.some((kingMove) => {
        const kingMoveRow = 8 - Number.parseInt(kingMove[1]);
        const kingMoveCol = kingMove.codePointAt(0)! - 97;
        return (
          kingMoveRow === expectedRow && Math.abs(kingMoveCol - kingCol) === 2
        );
      });
    }

    return false;
  });

  if (castlingMoves.length === 0) {
    return null;
  }

  if (currentPiece.toLowerCase() === "k") {
    const castlingMove = castlingMoves[0];
    const kingTargetCol = castlingMove.codePointAt(0)! - 97;

    if (kingTargetCol === 2) {
      return String.fromCodePoint(97 + 0) + (8 - expectedRow);
    } else if (kingTargetCol === 6) {
      return String.fromCodePoint(97 + 7) + (8 - expectedRow);
    }
  } else if (currentPiece.toLowerCase() === "r") {
    const kingSquare = String.fromCodePoint(97 + 4) + (8 - expectedRow);
    const kingPiece = board[expectedRow][4];

    if (
      kingPiece &&
      kingPiece.toLowerCase() === "k" &&
      (kingPiece === kingPiece.toUpperCase()) === isWhitePiece
    ) {
      return kingSquare;
    }
  }

  return null;
};

const RenderSquare = ({
  row,
  col,
  piece,
  isPlayer,
  isValidMove,
  isOpponentSquare,
  isCastlingPartner,
  cellSize,
  animations,
}: {
  row: number;
  col: number;
  piece: string | null;
  isPlayer: boolean;
  isValidMove: boolean;
  isOpponentSquare: boolean;
  isCastlingPartner: boolean;
  cellSize: number;
  animations: { from: string; to: string; piece: string }[];
}) => {
  let baseClass = "";
  if (isPlayer) {
    baseClass = isWhiteSquare(row, col)
      ? "white current-player"
      : "black current-player";
  } else if (isCastlingPartner) {
    baseClass = isWhiteSquare(row, col)
      ? "white castling-partner"
      : "black castling-partner";
  } else {
    baseClass = isWhiteSquare(row, col) ? "white" : "black";
  }

  const squareName = getSquareName(row, col);
  const move = animations.find((a) => a.to === squareName);
  const fromSquare = move?.from ?? null;

  const [springProps, api] = useSpring(() => ({
    x: col,
    y: row,
    config: { tension: 120, friction: 20 },
  }));

  useEffect(() => {
    const isAnimating = fromSquare !== null;
    if (isAnimating) {
      const fromCol = fromSquare.codePointAt(0)! - 97;
      const fromRow = 8 - Number.parseInt(fromSquare[1]);

      api.start({
        from: { x: fromCol, y: fromRow },
        to: { x: col, y: row },
        immediate: false,
      });
    } else {
      api.start({ x: col, y: row, immediate: true });
    }
  }, [fromSquare, col, row, api]);

  return (
    <div
      key={`${row}-${col}`}
      className={baseClass}
      style={{ position: "relative" }}
    >
      {isValidMove && (
        <>
          <div
            className={`valid-move ${
              isOpponentSquare ? "highlight-opponent" : "highlight-move"
            }`}
          />
          <div className="pointer" />
        </>
      )}
      {piece && (
        <animated.img
          src={pieces[piece]}
          alt={piece}
          className="chess-pieces"
          style={{
            position: "absolute",
            width: "75%",
            height: "75%",
            top: "12.5%",
            left: "12.5%",
            pointerEvents: "none",
            transform: to(
              [springProps.x, springProps.y],
              (xVal, yVal) =>
                `translate(${(xVal - col) * cellSize}px, ${
                  (yVal - row) * cellSize
                }px)`
            ),
            zIndex: 5,
          }}
        />
      )}
    </div>
  );
};

function findChangedSquares(
  oldBoard: string[][],
  newBoard: string[][],
  type: "from" | "to"
): Record<string, string> {
  const changedSquares: Record<string, string> = {};

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = getSquareName(row, col);
      const oldPiece = oldBoard[row][col];
      const newPiece = newBoard[row][col];

      if (type === "from" && oldPiece && !newPiece) {
        changedSquares[square] = oldPiece;
      } else if (type === "to" && !oldPiece && newPiece) {
        changedSquares[square] = newPiece;
      }
    }
  }

  return changedSquares;
}

function matchMovements(
  fromSquares: Record<string, string>,
  toSquares: Record<string, string>
): { from: string; to: string; piece: string }[] {
  const movements: { from: string; to: string; piece: string }[] = [];

  for (const [to, piece] of Object.entries(toSquares)) {
    const from = Object.entries(fromSquares).find(([, p]) => p === piece);
    if (from) {
      movements.push({ from: from[0], to, piece });
    }
  }

  return movements;
}

const ChessBoard = () => {
  const {
    fenString,
    validMoves: rawValidMoves,
    activeSquare,
    opponentSquares: rawOpponentSquares,
    isCheckMate,
    isStaleMate,
    gameStarted,
  } = useGameInfo();

  const validMoves = useMemo(
    () => rawValidMoves.map((m) => m.slice(2)),
    [rawValidMoves]
  );

  const opponentSquares = useMemo(
    () =>
      rawOpponentSquares
        .map((m) => new RegExp(/[a-h][1-8]$/).exec(m)?.[0])
        .filter(Boolean),
    [rawOpponentSquares]
  );

  const [animations, setAnimations] = useState<
    { from: string; to: string; piece: string }[]
  >([]);

  const { showSuccess } = useNotification();

  const prevFenRef = useRef<string>(fenString);
  const boardRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(0);

  useLayoutEffect(() => {
    if (boardRef.current) {
      const width = boardRef.current.clientWidth;
      setCellSize(width / 8);
    }
  }, [fenString]);

  const calculateAnimations = useCallback(
    (
      newFen: string,
      oldFen: string
    ): { from: string; to: string; piece: string }[] => {
      const oldBoard = parseFen(oldFen);
      const newBoard = parseFen(newFen);

      const fromSquares = findChangedSquares(oldBoard, newBoard, "from");
      const toSquares = findChangedSquares(oldBoard, newBoard, "to");

      return matchMovements(fromSquares, toSquares);
    },
    []
  );

  useEffect(() => {
    if (fenString !== prevFenRef.current) {
      const movements = calculateAnimations(fenString, prevFenRef.current);
      setAnimations(movements);
      prevFenRef.current = fenString;
    }
  }, [fenString, calculateAnimations]);

  useEffect(() => {
    if ((isCheckMate || isStaleMate) && gameStarted) {
      const winner = isCheckMate
        ? "Spiel vorbei - Schachmatt!"
        : "Spiel vorbei - Remis!";
      showSuccess(winner);
    }
  }, [isCheckMate, isStaleMate, gameStarted, showSuccess]);

  const board = parseFen(fenString);
  const squares: JSX.Element[] = [];

  const castlingPartnerSquare = activeSquare
    ? getCastlingPartner(activeSquare, board, validMoves)
    : null;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      const squareName = getSquareName(row, col);
      const isPlayer = squareName === activeSquare;
      const isValidMove = validMoves.includes(squareName) && !isPlayer;
      const isOpponentSquare =
        isValidMove && opponentSquares.includes(squareName);
      const isCastlingPartner = castlingPartnerSquare === squareName;

      squares.push(
        <RenderSquare
          key={`${row}-${col}`}
          row={row}
          col={col}
          piece={piece}
          isPlayer={isPlayer}
          isValidMove={isValidMove}
          isOpponentSquare={isOpponentSquare}
          isCastlingPartner={isCastlingPartner}
          cellSize={cellSize}
          animations={animations}
        />
      );
    }
  }

  return (
    <div className="chessboard-primary-div">
      <div className="chessboard" ref={boardRef}>
        {squares}
      </div>
    </div>
  );
};

export default ChessBoard;
