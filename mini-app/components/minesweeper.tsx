"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const GRID_SIZE = 9;
const NUM_MINES = 10;

type Cell = {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
};

export function Minesweeper() {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    const newGrid: Cell[][] = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => ({
        mine: false,
        revealed: false,
        flagged: false,
        adjacent: 0,
      }))
    );

    // place mines
    let minesPlaced = 0;
    while (minesPlaced < NUM_MINES) {
      const r = Math.floor(Math.random() * GRID_SIZE);
      const c = Math.floor(Math.random() * GRID_SIZE);
      if (!newGrid[r][c].mine) {
        newGrid[r][c].mine = true;
        minesPlaced++;
      }
    }

    // calculate adjacent counts
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (newGrid[r][c].mine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
              if (newGrid[nr][nc].mine) count++;
            }
          }
        }
        newGrid[r][c].adjacent = count;
      }
    }

    setGrid(newGrid);
  }, []);

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
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = currentGrid[r][c];
        if (!cell.mine && !cell.revealed) return;
      }
    }
    setWon(true);
    setGameOver(true);
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
      <div
        className="grid grid-cols-9 gap-1"
        style={{ width: "max-content" }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => renderCell(cell, r, c))
        )}
      </div>
      <Button onClick={resetGame} variant="outline" size="sm" className="mt-4">
        Restart
      </Button>
      {gameOver && (
        <div className="text-xl font-semibold">
          {won ? "You Win!" : "Game Over"}
        </div>
      )}
    </div>
  );
}
