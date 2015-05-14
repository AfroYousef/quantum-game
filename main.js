
var nX = 13;
var nY = 10;

var board = new Board(nX, nY);

// for (i = 0; i < nX; i++) {
//   board.board[i] = [];
//   for (j = 0; j < nY; j++) {
//     board.board[i][j] = Math.random() > 0.9 ? new Elements.PolarizingBeamSplitter() : new Elements.Vacuum();
//   }
// }

board.board[2][7] = new Elements.Source();

board.board[4][7] = new Elements.ThinBeamSplitter();
board.board[4][7].rotation = 1;

board.drawBackground();
board.draw();

board.stateInit();

board.statePropagate();
board.statePropagate();
board.statePropagate();

board.animationRun();
