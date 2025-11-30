"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Leaderboard from "@/components/leaderboard";


type Cell = {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
};

export function Minesweeper() {
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Expert">("Beginner");
  const difficultySettings = {
    Beginner: { gridSize: 9, numMines: 10 },
    Intermediate: { gridSize: 16, numMines: 40 },
    Expert: { gridSize: 30, numMines: 99 },
  };
  const { gridSize, numMines } = difficultySettings[difficulty];
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [time, setTime] = useState(0);
  const [leaderboard, setLeaderboard] = useState<number[]>([]);

  useEffect(() => {
    const newGrid: Cell[][] = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => ({
        mine: false,
        revealed: false,
        flagged: false,
        adjacent: 0,
      }))
    );

    // place mines
    let minesPlaced = 0;
    while (minesPlaced < numMines) {
      const r = Math.floor(Math.random() * gridSize);
      const c = Math.floor(Math.random() * gridSize);
      if (!newGrid[r][c].mine) {
        newGrid[r][c].mine = true;
        minesPlaced++;
      }
    }

    // calculate adjacent counts
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (newGrid[r][c].mine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
              if (newGrid[nr][nc].mine) count++;
            }
          }
        }
        newGrid[r][c].adjacent = count;
      }
    }

    setGrid(newGrid);
  }, [gridSize, numMines]);

  useEffect(() => {
    const stored = localStorage.getItem("minesweeper-leaderboard");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setLeaderboard(parsed);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!gameOver) {
      const id = setInterval(() => setTime(t => t + 1), 1000);
      return () => clearInterval(id);
    }
  }, [gameOver]);

  const revealCell = (r: number, c: number) => {
    if (gameOver || grid[r][c].revealed || grid[r][c].flagged) return;
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    const cell = newGrid[r][c];
    cell.revealed = true;
    if (cell.mine) {
      setGameOver(true);
      setGrid(newGrid);
      return;
    }
    if (cell.adjacent === 0) {
      // flood fill
      const stack: [number, number][] = [[r, c]];
      while (stack.length) {
        const [cr, cc] = stack.pop()!;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = cr + dr;
            const nc = cc + dc;
            if (
              nr >= 0 &&
              nr < GRID_SIZE &&
              nc >= 0 &&
              nc < GRID_SIZE &&
              !newGrid[nr][nc].revealed &&
              !newGrid[nr][nc].flagged
            ) {
              newGrid[nr][nc].revealed = true;
              if (newGrid[nr][nc].adjacent === 0) {
                stack.push([nr, nc]);
              }
            }
          }
        }
      }
    }
    setGrid(newGrid);
    checkWin(newGrid);
  };

  const toggleFlag = (r: number, c: number) => {
    if (gameOver || grid[r][c].revealed) return;
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    newGrid[r][c].flagged = !newGrid[r][c].flagged;
    setGrid(newGrid);
  };

  const checkWin = (currentGrid: Cell[][]) => {
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cell = currentGrid[r][c];
        if (!cell.mine && !cell.revealed) return;
      }
    }
    setWon(true);
    setGameOver(true);
    const newTimes = [...leaderboard, time].sort((a, b) => a - b).slice(0, 10);
    setLeaderboard(newTimes);
    localStorage.setItem("minesweeper-leaderboard", JSON.stringify(newTimes));
  };

  const resetGame = () => {
    const newGrid: Cell[][] = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => ({
        mine: false,
        revealed: false,
        flagged: false,
        adjacent: 0,
      }))
    );

    // place mines
    let minesPlaced = 0;
    while (minesPlaced < numMines) {
      const r = Math.floor(Math.random() * gridSize);
      const c = Math.floor(Math.random() * gridSize);
      if (!newGrid[r][c].mine) {
        newGrid[r][c].mine = true;
        minesPlaced++;
      }
    }

    // calculate adjacent counts
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (newGrid[r][c].mine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
              if (newGrid[nr][nc].mine) count++;
            }
          }
        }
        newGrid[r][c].adjacent = count;
      }
    }

    setGrid(newGrid);
    setGameOver(false);
    setWon(false);
    setTime(0);
  };
  const renderCell = (cell: Cell, r: number, c: number) => {
    let content = "";
    if (cell.revealed) {
      if (cell.mine) {
        content = "💣";
      } else if (cell.adjacent > 0) {
        content = cell.adjacent.toString();
      }
    } else if (cell.flagged) {
      content = "🚩";
    }

    const bgClass = cell.revealed && cell.mine
      ? "bg-red-500"
      : !cell.revealed
      ? "bg-gray-800"
      : "";

    return (
      <Button
        key={`${r}-${c}`}
        variant="outline"
        size="sm"
        className={`w-10 h-10 p-0 ${bgClass}`}
        onClick={() => revealCell(r, c)}
        onContextMenu={e => {
          e.preventDefault();
          toggleFlag(r, c);
        }}
      >
        {content}
      </Button>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2 mb-2">
        {["Beginner", "Intermediate", "Expert"].map(opt => (
          <Button
            key={opt}
            variant={difficulty === opt ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setDifficulty(opt as any);
              resetGame();
            }}
          >
            {opt}
          </Button>
        ))}
      </div>
      <div
        className={`grid grid-cols-${gridSize} gap-1`}
        style={{ width: "max-content" }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => renderCell(cell, r, c))
        )}
      </div>
      <Button onClick={resetGame} variant="outline" size="sm" className="mt-4">
        Restart
      </Button>
      <div className="text-lg">
        Time: {Math.floor(time / 60).toString().padStart(2, "0")}:
        {(time % 60).toString().padStart(2, "0")}
      </div>
      <Leaderboard times={leaderboard} />
      {gameOver && (
        <div className="text-xl font-semibold">
          {won ? "You Win!" : "Game Over"}
        </div>
      )}
    </div>
  );
}
