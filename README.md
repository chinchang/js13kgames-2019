# REPEEWSENIM

This is my game entry for the js13kGames compo 2019 - https://js13kgames.com/games/repeewsenim/index.html

## Gameplay

_Repeewsenim_ is derived from the classic game of Minesweeper. The twist here is that you need to play it backwards, in reverse. You know where the bombs are, and need to put correct numbers on the tiles.

### If you know how to play Minesweeper:

You need to play Minesweeper backwards. You know where the bombs and you need to put correct number on each tile.

### If you don't know how to play Minesweeper:

A grid will show up with bombs placed in random cells. Your task is to assign correct number to each cell which does not have a bomb.

A cell's number is the count of bombs that are placed around it i.e. the (at most) eight cells surrounding it. So if there is just one bomb around a cell, its number should be 1 and so on...If there is no bomb around a cell, it should be left empty.

## Controls

### Mouse:

Click any cell to cycle between values 0 to 8. Left click increments by 1 and right click decrements by 1.

### Keyboard

**This game is screen-reader compatible.**

Navigate through cells with <kbd>Tab</kbd> or <kbd>Arrow</kbd> keys. Press <kbd>Space</kbd> or <kbd>Enter</kbd> key to cycle between values 0 to 8 or simply press the numeric key to assign value directly.

## Technical details

- The game is made with web technologies: HTML, CSS and JavaScript.
- It is completely DOM based. Uses no Canvas!
- Being DOM based, the game inherently screen-reader compatible!
- The zipped size of the game is less than 13KB, of course :)

## License

Open-source under The MIT license.
Copyright 2019 Kushagra Gour.
