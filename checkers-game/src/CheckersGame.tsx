import React, { useState, useEffect } from 'react';
import { AlertCircle, RotateCcw, Settings } from 'lucide-react';

const BOARD_SIZE = 8;
const EMPTY = 0;
const WHITE = 1;
const BLACK = 2;
const WHITE_KING = 3;
const BLACK_KING = 4;

const evaluatePosition = (board: number[][]) => {
  let score = 0;
  
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      const piece = board[i][j];
      
      if (piece === WHITE) {
        score += 100;
        score += i * 5;
      } else if (piece === WHITE_KING) {
        score += 300;
      } else if (piece === BLACK) {
        score -= 100;
        score -= (7 - i) * 5;
      } else if (piece === BLACK_KING) {
        score -= 300;
      }
    }
  }
  
  return score;
};

const isKing = (piece: number) => piece === WHITE_KING || piece === BLACK_KING;

const isPlayerPiece = (piece: number, player: number) => {
  if (player === WHITE) return piece === WHITE || piece === WHITE_KING;
  return piece === BLACK || piece === BLACK_KING;
};

const getAllMoves = (board: number[][], player: number) => {
  const captures: any[] = [];
  const regularMoves: any[] = [];
  
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (isPlayerPiece(board[i][j], player)) {
        const moves = getPieceMoves(board, i, j);
        moves.forEach((move: any) => {
          if (move.captures && move.captures.length > 0) {
            captures.push({ from: { row: i, col: j }, ...move });
          } else {
            regularMoves.push({ from: { row: i, col: j }, ...move });
          }
        });
      }
    }
  }
  
    return captures.length > 0 ? captures : regularMoves;
};

const getPieceMoves = (board: number[][], row: number, col: number) => {
  const piece = board[row][col];
  const moves: any[] = [];
  
  if (piece === EMPTY) return moves;
  
    let directions: number[][] = [];
  if (piece === WHITE) {
    directions = [[-1, -1], [-1, 1]];
  } else if (piece === BLACK) {
    directions = [[1, -1], [1, 1]];
  } else {
    directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  }
  
    const captureSequences = findAllCaptures(board, row, col, [], []);
  
  if (captureSequences.length > 0) {
    captureSequences.forEach((seq: any) => {
      moves.push({
        to: seq[seq.length - 1],
        captures: seq.slice(0, -1).map((_: any, i: number) => seq[i])
      });
    });
  } else {
        directions.forEach(([dr, dc]) => {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
        if (board[newRow][newCol] === EMPTY) {
          moves.push({ to: { row: newRow, col: newCol }, captures: [] });
        }
      }
    });
  }
  
  return moves;
};

const findAllCaptures = (board: number[][], row: number, col: number, currentPath: any[], captured: string[]) => {
  const piece = board[row][col];
  const player = isPlayerPiece(piece, WHITE) ? WHITE : BLACK;
  const opponent = player === WHITE ? BLACK : WHITE;
  
  let directions = isKing(piece) 
    ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
    : [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  
  let sequences: any[] = [];
  let foundCapture = false;
  
  directions.forEach(([dr, dc]) => {
    const captureRow = row + dr;
    const captureCol = col + dc;
    const landRow = row + dr * 2;
    const landCol = col + dc * 2;
    
    if (landRow >= 0 && landRow < BOARD_SIZE && landCol >= 0 && landCol < BOARD_SIZE) {
      const capturedKey = `${captureRow},${captureCol}`;
      
      if (isPlayerPiece(board[captureRow][captureCol], opponent) && 
          board[landRow][landCol] === EMPTY &&
          !captured.includes(capturedKey)) {
        
        foundCapture = true;
        
                const tempBoard = board.map((r: number[]) => [...r]);
        tempBoard[landRow][landCol] = tempBoard[row][col];
        tempBoard[row][col] = EMPTY;
        tempBoard[captureRow][captureCol] = EMPTY;
        
        const newPath = [...currentPath, { row: captureRow, col: captureCol }];
        const newCaptured = [...captured, capturedKey];
        
        const furtherCaptures = findAllCaptures(tempBoard, landRow, landCol, newPath, newCaptured);
        
        if (furtherCaptures.length > 0) {
          sequences.push(...furtherCaptures);
        } else {
          sequences.push([...newPath, { row: landRow, col: landCol }]);
        }
      }
    }
  });
  
  if (!foundCapture && currentPath.length > 0) {
    sequences.push([...currentPath, { row, col }]);
  }
  
  return sequences;
};

const applyMove = (board: number[][], move: any) => {
  const newBoard = board.map(row => [...row]);
  const { from, to, captures } = move;
  
  let piece = newBoard[from.row][from.col];
  newBoard[from.row][from.col] = EMPTY;
  
    if (captures && captures.length > 0) {
    captures.forEach((cap: any) => {
      newBoard[cap.row][cap.col] = EMPTY;
    });
  }
  
    if (piece === WHITE && to.row === 0) piece = WHITE_KING;
  if (piece === BLACK && to.row === BOARD_SIZE - 1) piece = BLACK_KING;
  
  newBoard[to.row][to.col] = piece;
  
  return newBoard;
};

const minimax = (board: number[][], depth: number, alpha: number, beta: number, maximizingPlayer: boolean, player: number) => {
  if (depth === 0) {
    return { score: evaluatePosition(board), move: null };
  }
  
  const moves = getAllMoves(board, player);
  
  if (moves.length === 0) {
        return { score: maximizingPlayer ? -Infinity : Infinity, move: null };
  }
  
  if (maximizingPlayer) {
    let maxEval = -Infinity;
    let bestMove = null;
    
    for (const move of moves) {
      const newBoard = applyMove(board, move);
      const evaluation = minimax(newBoard, depth - 1, alpha, beta, false, BLACK);
      
      if (evaluation.score > maxEval) {
        maxEval = evaluation.score;
        bestMove = move;
      }
      
      alpha = Math.max(alpha, evaluation.score);
      if (beta <= alpha) break;     }
    
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    let bestMove = null;
    
    for (const move of moves) {
      const newBoard = applyMove(board, move);
      const evaluation = minimax(newBoard, depth - 1, alpha, beta, true, WHITE);
      
      if (evaluation.score < minEval) {
        minEval = evaluation.score;
        bestMove = move;
      }
      
      beta = Math.min(beta, evaluation.score);
      if (beta <= alpha) break;     }
    
    return { score: minEval, move: bestMove };
  }
};

const CheckersGame = () => {
  const [board, setBoard] = useState<number[][] | null>(null);
  const [selected, setSelected] = useState<{row: number, col: number} | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<any[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState(WHITE);
  const [winner, setWinner] = useState<number | null>(null);
  const [depth, setDepth] = useState(6);
  const [showSettings, setShowSettings] = useState(false);
  const [thinking, setThinking] = useState(false);
  
    const initBoard = () => {
    const newBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
    
        for (let i = 0; i < 3; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if ((i + j) % 2 === 1) {
          newBoard[i][j] = BLACK;
        }
      }
    }
    
        for (let i = 5; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if ((i + j) % 2 === 1) {
          newBoard[i][j] = WHITE;
        }
      }
    }
    
    return newBoard;
  };
  
  useEffect(() => {
    setBoard(initBoard());
  }, []);
  
    useEffect(() => {
    if (board && currentPlayer === BLACK && !winner && !thinking) {
      setThinking(true);
      
      setTimeout(() => {
        const result = minimax(board, depth, -Infinity, Infinity, false, BLACK);
        
        if (result.move) {
          const newBoard = applyMove(board, result.move);
          setBoard(newBoard);
          setCurrentPlayer(WHITE);
          
          const whiteMoves = getAllMoves(newBoard, WHITE);
          if (whiteMoves.length === 0) {
            setWinner(BLACK);
          }
        }
        
        setThinking(false);
      }, 300);
    }
  }, [board, currentPlayer, winner, depth, thinking]);
  
  const handleCellClick = (row: number, col: number) => {
    if (currentPlayer !== WHITE || winner || thinking) return;
    
    const piece = board![row][col];
    
    if (selected) {
            const move = possibleMoves.find((m: any) => m.to.row === row && m.to.col === col);
      
      if (move) {
        const newBoard = applyMove(board!, { from: selected, ...move });
        setBoard(newBoard);
        setSelected(null);
        setPossibleMoves([]);
        setCurrentPlayer(BLACK);
        
        const blackMoves = getAllMoves(newBoard, BLACK);
        if (blackMoves.length === 0) {
          setWinner(WHITE);
        }
      } else if (isPlayerPiece(piece, WHITE)) {
                setSelected({ row, col });
        setPossibleMoves(getPieceMoves(board!, row, col));
      } else {
        setSelected(null);
        setPossibleMoves([]);
      }
    } else if (isPlayerPiece(piece, WHITE)) {
            setSelected({ row, col });
      setPossibleMoves(getPieceMoves(board!, row, col));
    }
  };
  
  const resetGame = () => {
    setBoard(initBoard());
    setSelected(null);
    setPossibleMoves([]);
    setCurrentPlayer(WHITE);
    setWinner(null);
    setThinking(false);
  };
  
  const getPieceSymbol = (piece: number) => {
    if (piece === WHITE) return (
      <span className="inline-block w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-gray-300 shadow-md"></span>
    );
    if (piece === BLACK) return (
      <span className="inline-block w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800 border-2 border-gray-600 shadow-md"></span>
    );
    if (piece === WHITE_KING) return (
      <span className="inline-block w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-yellow-300 shadow-md flex items-center justify-center text-yellow-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </span>
    );
    if (piece === BLACK_KING) return (
      <span className="inline-block w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800 border-2 border-yellow-500 shadow-md flex items-center justify-center text-yellow-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </span>
    );
    return '';
  };
  
  if (!board) return <div className="flex justify-center items-center h-screen">Завантаження...</div>;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Шашечки</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
              >
                <Settings size={20} />
              </button>
              <button
                onClick={resetGame}
                className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
              >
                <RotateCcw size={20} />
              </button>
            </div>
          </div>
          
          {showSettings && (
            <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <label className="text-white block mb-2">
                Складність (глибина пошуку): <span className="font-bold">{depth}</span>
              </label>
              <input
                type="range"
                min="2"
                max="8"
                value={depth}
                onChange={(e) => setDepth(parseInt(e.target.value))}
                className="w-full"
                disabled={currentPlayer === BLACK || thinking}
              />
              <div className="text-sm text-white/60 mt-2">
                2-3: Легко | 4-5: Середньо | 6-7: Складно | 8: Експерт
              </div>
            </div>
          )}
          
          <div className="mb-4 flex justify-between items-center">
            <div className="text-white text-lg">
              Хід: <span className="font-bold">{currentPlayer === WHITE ? 'Ви (⚪)' : 'Бот (⚫)'}</span>
            </div>
            {thinking && (
              <div className="text-yellow-300 flex items-center gap-2">
                <div className="animate-spin">⚙️</div>
                Бот думає...
              </div>
            )}
          </div>
          
          {winner && (
            <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg flex items-center gap-2">
              <AlertCircle className="text-green-300" />
              <span className="text-white font-bold">
                {winner === WHITE ? 'Ви перемогли!' : 'Бот переміг!'}
              </span>
            </div>
          )}
          
          <div className="inline-block bg-amber-900 p-2 rounded-lg shadow-2xl border-4 border-amber-900">
            {board.map((row, i) => (
              <div key={i} className="flex">
                {row.map((cell, j) => {
                  const isDark = (i + j) % 2 === 1;
                  const isSelected = selected && selected.row === i && selected.col === j;
                  const isPossibleMove = possibleMoves.some((m: any) => m.to.row === i && m.to.col === j);
                  
                  return (
                    <div
                      key={j}
                      onClick={() => handleCellClick(i, j)}
                      className={`
                        w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center cursor-pointer
                        transition-all duration-200
                        ${isSelected ? 'ring-4 ring-yellow-400' : ''}
                        ${isPossibleMove ? 'ring-4 ring-green-400 animate-pulse' : ''}
                        ${!winner && currentPlayer === WHITE && isPlayerPiece(cell, WHITE) ? 'hover:brightness-110' : ''}
                        relative overflow-hidden
                      `}
                      style={{
                        backgroundColor: (i + j) % 2 === 1 ? '#b45309' : '#fef3c7',
                        border: '1px solid',
                        borderColor: (i + j) % 2 === 1 ? '#92400e' : '#d1a05a',
                        boxShadow: (i + j) % 2 === 0 
                          ? 'inset 1px 1px 3px rgba(0,0,0,0.1)' 
                          : 'inset 0 0 10px rgba(0,0,0,0.2)'
                      }}
                    >
                      {getPieceSymbol(cell)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-white/70 text-sm">
            <p>🎮 Ви граєте білими (⚪). Бот — чорними (⚫)</p>
            <p>👑 Дамки позначені коронами</p>
            <p>💡 Збільште складність для сильнішого AI</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckersGame;
