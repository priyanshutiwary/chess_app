'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"

const pieces = {
  'w': {
    'p': '♙', 'r': '♖', 'n': '♘', 'b': '♗', 'q': '♕', 'k': '♔'
  },
  'b': {
    'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚'
  }
}

type Piece = {
  type: string
  color: 'w' | 'b'
}

type Square = Piece | null

type Move = {
  from: [number, number]
  to: [number, number]
  piece: Piece
  captured?: Piece
}

const initialBoard: Square[][] = [
  [{ type: 'r', color: 'b' }, { type: 'n', color: 'b' }, { type: 'b', color: 'b' }, { type: 'q', color: 'b' }, { type: 'k', color: 'b' }, { type: 'b', color: 'b' }, { type: 'n', color: 'b' }, { type: 'r', color: 'b' }],
  [{ type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }],
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  [{ type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }],
  [{ type: 'r', color: 'w' }, { type: 'n', color: 'w' }, { type: 'b', color: 'w' }, { type: 'q', color: 'w' }, { type: 'k', color: 'w' }, { type: 'b', color: 'w' }, { type: 'n', color: 'w' }, { type: 'r', color: 'w' }],
]

export function EnhancedChessGame() {
  const [board, setBoard] = useState<Square[][]>(initialBoard)
  const [selectedPiece, setSelectedPiece] = useState<{ row: number; col: number } | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<'w' | 'b'>('w')
  const [validMoves, setValidMoves] = useState<[number, number][]>([])
  const [capturedPieces, setCapturedPieces] = useState<{ w: Piece[], b: Piece[] }>({ w: [], b: [] })
  const [gameStatus, setGameStatus] = useState<'playing' | 'check' | 'checkmate' | 'stalemate'>('playing')
  const [isComputerThinking, setIsComputerThinking] = useState(false)
  const [lastMove, setLastMove] = useState<{ from: [number, number], to: [number, number] } | null>(null)
  const [whiteTime, setWhiteTime] = useState(1800) // 30 minutes in seconds
  const [blackTime, setBlackTime] = useState(1800)
  const [isGameOver, setIsGameOver] = useState(false)
  const [movesCount, setMovesCount] = useState({ w: 0, b: 0 })
  const [isTimedMode, setIsTimedMode] = useState(false)
  const [moveHistory, setMoveHistory] = useState<Move[]>([])

  const isKingInCheck = useCallback((board: Square[][], color: 'w' | 'b'): boolean => {
    let kingPosition: [number, number] | null = null;
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (board[i][j]?.type === 'k' && board[i][j]?.color === color) {
          kingPosition = [i, j];
          break;
        }
      }
      if (kingPosition) break;
    }

    if (!kingPosition) return false;

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece && piece.color !== color) {
          if (isValidMove(i, j, kingPosition[0], kingPosition[1], piece, board, true)) {
            return true;
          }
        }
      }
    }

    return false;
  }, []);

  const isValidMove = useCallback((
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
    piece: Piece,
    currentBoard: Square[][],
    ignoreKingCheck: boolean = false
  ): boolean => {
    const rowDiff = Math.abs(endRow - startRow)
    const colDiff = Math.abs(endCol - startCol)

    if (endRow < 0 || endRow > 7 || endCol < 0 || endCol > 7) {
      return false;
    }

    if (currentBoard[endRow][endCol]?.color === piece.color) {
      return false;
    }

    let isValid = false;

    switch (piece.type) {
      case 'p':
        const direction = piece.color === 'w' ? -1 : 1
        const initialRow = piece.color === 'w' ? 6 : 1

        if (
          (startCol === endCol && startRow + direction === endRow && !currentBoard[endRow][endCol]) ||
          (startRow === initialRow && startCol === endCol && startRow + 2 * direction === endRow && !currentBoard[endRow][endCol] && !currentBoard[startRow + direction][startCol]) ||
          (Math.abs(startCol - endCol) === 1 && startRow + direction === endRow && currentBoard[endRow][endCol] && currentBoard[endRow][endCol]?.color !== piece.color)
        ) {
          isValid = true;
        }
        break

      case 'r':
        if (rowDiff === 0 || colDiff === 0) {
          const rowStep = rowDiff === 0 ? 0 : (endRow > startRow ? 1 : -1)
          const colStep = colDiff === 0 ? 0 : (endCol > startCol ? 1 : -1)
          let currentRow = startRow + rowStep
          let currentCol = startCol + colStep

          isValid = true;
          while (currentRow !== endRow || currentCol !== endCol) {
            if (currentBoard[currentRow][currentCol]) {
              isValid = false;
              break;
            }
            currentRow += rowStep
            currentCol += colStep
          }
        }
        break

      case 'n':
        isValid = (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)
        break

      case 'b':
        if (rowDiff === colDiff) {
          const rowStep = endRow > startRow ? 1 : -1
          const colStep = endCol > startCol ? 1 : -1
          let currentRow = startRow + rowStep
          let currentCol = startCol + colStep

          isValid = true;
          while (currentRow !== endRow && currentCol !== endCol) {
            if (currentBoard[currentRow][currentCol]) {
              isValid = false;
              break;
            }
            currentRow += rowStep
            currentCol += colStep
          }
        }
        break

      case 'q':
        if (rowDiff === 0 || colDiff === 0 || rowDiff === colDiff) {
          const rowStep = rowDiff === 0 ? 0 : (endRow > startRow ? 1 : -1)
          const colStep = colDiff === 0 ? 0 : (endCol > startCol ? 1 : -1)
          let currentRow = startRow + rowStep
          let currentCol = startCol + colStep

          isValid = true;
          while (currentRow !== endRow || currentCol !== endCol) {
            if (currentBoard[currentRow][currentCol]) {
              isValid = false;
              break;
            }
            currentRow += rowStep
            currentCol += colStep
          }
        }
        break

      case 'k':
        isValid = rowDiff <= 1 && colDiff <= 1
        break
    }

    if (isValid && !ignoreKingCheck) {
      const newBoard = currentBoard.map(row => [...row]);
      newBoard[endRow][endCol] = newBoard[startRow][startCol];
      newBoard[startRow][startCol] = null;
      if (isKingInCheck(newBoard, piece.color)) {
        isValid = false;
      }
    }

    return isValid;
  }, [isKingInCheck]);

  const getValidMoves = useCallback((row: number, col: number, currentBoard: Square[][]): [number, number][] => {
    const piece = currentBoard[row][col]
    if (!piece) return []

    const moves: [number, number][] = []
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (isValidMove(row, col, i, j, piece, currentBoard)) {
          moves.push([i, j])
        }
      }
    }
    return moves
  }, [isValidMove])

  const makeMove = useCallback((startRow: number, startCol: number, endRow: number, endCol: number) => {
    const newBoard = board.map(row => [...row])
    const piece = newBoard[startRow][startCol]
    const capturedPiece = newBoard[endRow][endCol]
    newBoard[endRow][endCol] = piece
    newBoard[startRow][startCol] = null

    if (capturedPiece) {
      setCapturedPieces(prev => ({
        ...prev,
        [currentPlayer]: [...prev[currentPlayer], capturedPiece]
      }))
    }

    setBoard(newBoard)
    setCurrentPlayer(currentPlayer === 'w' ? 'b' : 'w')
    setLastMove({ from: [startRow, startCol], to: [endRow, endCol] })
    setMovesCount(prev => ({
      ...prev,
      [currentPlayer]: prev[currentPlayer] + 1
    }))

    // Add move to history
    setMoveHistory(prev => [...prev, {
      from: [startRow, startCol],
      to: [endRow, endCol],
      piece: piece!,
      captured: capturedPiece
    }])

    const nextPlayer = currentPlayer === 'w' ? 'b' : 'w'
    if (isKingInCheck(newBoard, nextPlayer)) {
      setGameStatus('check')
    } else {
      setGameStatus('playing')
    }

    // Check if either player has run out of time in timed mode
    if (isTimedMode && (whiteTime <= 0 || blackTime <= 0)) {
      setIsGameOver(true)
      setGameStatus('checkmate')
    }
  }, [board, currentPlayer, isKingInCheck, whiteTime, blackTime, isTimedMode])

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (currentPlayer === 'b' || isGameOver) return; // Prevent moves during computer's turn or when game is over

    if (selectedPiece) {
      if (validMoves.some(([r, c]) => r === row && c === col)) {
        makeMove(selectedPiece.row, selectedPiece.col, row, col)
      }
      setSelectedPiece(null)
      setValidMoves([])
    } else {
      if (board[row][col] && board[row][col]?.color === currentPlayer) {
        setSelectedPiece({ row, col })
        setValidMoves(getValidMoves(row, col, board))
      }
    }
  }, [board, currentPlayer, selectedPiece, validMoves, getValidMoves, makeMove, isGameOver])

  const computerMove = useCallback(() => {
    setIsComputerThinking(true)
    setTimeout(() => {
      const allMoves: { start: [number, number], end: [number, number] }[] = []
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (board[i][j]?.color === 'b') {
            const moves = getValidMoves(i, j, board)
            moves.forEach(move => {
              allMoves.push({ start: [i, j], end: move })
            })
          }
        }
      }

      if (allMoves.length > 0) {
        const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)]
        makeMove(randomMove.start[0], randomMove.start[1], randomMove.end[0], randomMove.end[1])
      }
      setIsComputerThinking(false)
    }, 1000) // Simulate thinking time
  }, [board, getValidMoves, makeMove])

  useEffect(() => {
    const checkGameStatus = () => {
      let hasValidMoves = false;
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (board[i][j]?.color === currentPlayer) {
            const moves = getValidMoves(i, j, board);
            if (moves.length > 0) {
              hasValidMoves = true;
              break;
            }
          }
        }
        if (hasValidMoves) break;
      }

      if (!hasValidMoves) {
        if  (isKingInCheck(board, currentPlayer)) {
          setGameStatus('checkmate');
          setIsGameOver(true);
        } else {
          setGameStatus('stalemate');
          setIsGameOver(true);
        }
      }
    };

    checkGameStatus();

    // Trigger computer move if it's black's turn
    if (currentPlayer === 'b' && gameStatus === 'playing' && !isGameOver) {
      computerMove();
    }
  }, [board, currentPlayer, getValidMoves, isKingInCheck, gameStatus, computerMove, isGameOver]);

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isTimedMode && gameStatus === 'playing' && !isGameOver) {
      timer = setInterval(() => {
        if (currentPlayer === 'w') {
          setWhiteTime(prev => {
            if (prev <= 0) {
              clearInterval(timer)
              setIsGameOver(true)
              setGameStatus('checkmate')
              return 0
            }
            return prev - 1
          })
        } else {
          setBlackTime(prev => {
            if (prev <= 0) {
              clearInterval(timer)
              setIsGameOver(true)
              setGameStatus('checkmate')
              return 0
            }
            return prev - 1
          })
        }
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [currentPlayer, gameStatus, isGameOver, isTimedMode])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const resetGame = useCallback(() => {
    setBoard(initialBoard)
    setSelectedPiece(null)
    setCurrentPlayer('w')
    setValidMoves([])
    setCapturedPieces({ w: [], b: [] })
    setGameStatus('playing')
    setIsComputerThinking(false)
    setLastMove(null)
    setWhiteTime(1800)
    setBlackTime(1800)
    setIsGameOver(false)
    setMovesCount({ w: 0, b: 0 })
    setMoveHistory([])
  }, [])

  const toggleTimedMode = () => {
    setIsTimedMode(!isTimedMode)
    resetGame()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      <h1 className="text-5xl font-bold mb-8 text-gray-800 tracking-tight">Chess Royale</h1>
      <div className="flex flex-col lg:flex-row items-start gap-8">
        <Card className="p-6 bg-white shadow-2xl rounded-2xl">
          <CardContent>
            <div className="mb-4 text-2xl font-semibold text-center text-gray-700">
              {gameStatus === 'playing' && !isGameOver && (
                isComputerThinking 
                  ? <span className="text-blue-500">Computer is thinking...</span>
                  : `${currentPlayer === 'w' ? 'Your' : "Computer's"} Turn`
              )}
              {gameStatus === 'check' && <span className="text-red-500">Check!</span>}
              {(gameStatus === 'checkmate' || isGameOver) && (
                <span className="text-red-600">
                  {isTimedMode && whiteTime <= 0 ? "Black wins on time!" : 
                   isTimedMode && blackTime <= 0 ? "White wins on time!" : 
                   movesCount.w < movesCount.b ? "White wins!" :
                   movesCount.b < movesCount.w ? "Black wins!" :
                   "Checkmate!"}
                </span>
              )}
              {gameStatus === 'stalemate' && <span className="text-yellow-600">Stalemate!</span>}
            </div>
            {isTimedMode && (
              <div className="flex justify-between mb-4">
                <div className="text-lg font-semibold">White: {formatTime(whiteTime)}</div>
                <div className="text-lg font-semibold">Black: {formatTime(blackTime)}</div>
              </div>
            )}
            <div className="grid grid-cols-8 gap-0.5 bg-gray-300 p-2 rounded-lg shadow-inner" role="grid" aria-label="Chess board">
              {board.map((row, rowIndex) => (
                row.map((square, colIndex) => (
                  <motion.div
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-3xl sm:text-4xl cursor-pointer transition-all duration-300 ease-in-out
                      ${(rowIndex + colIndex) % 2 === 0 ? 'bg-amber-100' : 'bg-amber-700'}
                      ${selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex ? 'ring-4 ring-blue-400' : ''}
                      ${validMoves.some(([r, c]) => r === rowIndex && c === colIndex) ? 'ring-4 ring-green-400' : ''}
                      ${lastMove && (
                        (lastMove.from[0] === rowIndex && lastMove.from[1] === colIndex) ||
                        (lastMove.to[0] === rowIndex && lastMove.to[1] === colIndex)
                      ) ? 'bg-yellow-200' : ''}
                      ${currentPlayer === 'b' || isGameOver ? 'cursor-not-allowed' : 'hover:opacity-80'}
                    `}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                    whileHover={{ scale: currentPlayer === 'w' && !isGameOver ? 1.05 : 1 }}
                    whileTap={{ scale: currentPlayer === 'w' && !isGameOver ? 0.95 : 1 }}
                    role="gridcell"
                    aria-label={`${square ? `${square.color === 'w' ? 'White' : 'Black'} ${square.type}` : 'Empty square'} at row ${rowIndex + 1}, column ${colIndex + 1}`}
                    tabIndex={0}
                  >
                    {square && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className={`
                          ${square.color === 'w' ? 'text-gray-100' : 'text-gray-900'}
                          drop-shadow-md
                        `}
                        style={{
                          textShadow: square.color === 'w' ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none',
                        }}
                      >
                        {pieces[square.color][square.type]}
                      </motion.div>
                    )}
                    {validMoves.some(([r, c]) => r === rowIndex && c === colIndex) && (
                      <motion.div
                        className="absolute w-3 h-3 bg-green-500 rounded-full opacity-75"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      />
                    )}
                  </motion.div>
                ))
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4 w-full lg:w-64">
          <Card className="p-4 bg-white shadow-xl rounded-xl">
            <CardContent>
              <h2 className="text-xl font-semibold mb-2 text-gray-700">Captured Pieces</h2>
              <div className="flex flex-col gap-2">
                <div>
                  <h3 className="font-medium mb-1 text-gray-600">White (You)</h3>
                  <div className="flex flex-wrap gap-1">
                    <AnimatePresence>
                      {capturedPieces.b.map((piece, index) => (
                        <motion.span
                          key={index}
                          className="text-2xl"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                        >
                          {pieces[piece.color][piece.type]}
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-1 text-gray-600">Black (Computer)</h3>
                  <div className="flex flex-wrap gap-1">
                    <AnimatePresence>
                      {capturedPieces.w.map((piece, index) => (
                        <motion.span
                          key={index}
                          className="text-2xl"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                        >
                          {pieces[piece.color][piece.type]}
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="p-4 bg-white shadow-xl rounded-xl">
            <CardContent>
              <h2 className="text-xl font-semibold mb-2 text-gray-700">Move History</h2>
              <ScrollArea className="h-40 w-full rounded-md border p-4">
                {moveHistory.map((move, index) => (
                  <div key={index} className="mb-2">
                    <span className="font-medium">{index + 1}. </span>
                    {`${pieces[move.piece.color][move.piece.type]} ${String.fromCharCode(97 + move.from[1])}${8 - move.from[0]} → ${String.fromCharCode(97 + move.to[1])}${8 - move.to[0]}`}
                    {move.captured && ` x ${pieces[move.captured.color][move.captured.type]}`}
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
          <div className="flex items-center space-x-2 mb-4">
            <Switch
              id="timed-mode"
              checked={isTimedMode}
              onCheckedChange={toggleTimedMode}
            />
            <label
              htmlFor="timed-mode"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Timed Mode (30 minutes)
            </label>
          </div>
          <Button className="w-full text-lg py-6" onClick={resetGame}>New Game</Button>
        </div>
      </div>
    </div>
  )
}