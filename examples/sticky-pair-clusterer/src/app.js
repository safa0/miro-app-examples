const { board } = window.miro;
//////////////////////////////////////////////////////////////////////////////////////////////////
class MatrixCell {
  constructor(value, stickyNoteId) {
    this.value = value; // Integer value between 1-8
    this.stickyNoteId = stickyNoteId; // Reference to a sticky note
  }
}

class Matrix {
  constructor(rows, columns) {
    this.rows = rows;
    this.columns = columns;
    this.matrix = Array.from({ length: rows }, () => Array(columns).fill(null));
    this.columnToFrameMap = new Map(); // Maps column index to frame ID
    this.rowToStickyNotesMap = new Map(); // Maps row index to an array of sticky note IDs
  }

  setCell(row, col, value, stickyNoteId) {
    const cell = new MatrixCell(value, stickyNoteId);
    this.matrix[row][col] = cell;

    // Add sticky note ID to the row map
    if (!this.rowToStickyNotesMap.has(row)) {
      this.rowToStickyNotesMap.set(row, []);
    }
    this.rowToStickyNotesMap.get(row).push(stickyNoteId);
  }

  linkColumnToFrame(col, frameId) {
    this.columnToFrameMap.set(col, frameId);
  }

  getStickyNotesForRow(row) {
    return this.rowToStickyNotesMap.get(row) || [];
  }

  getFrameForColumn(col) {
    return this.columnToFrameMap.get(col);
  }
  // CRUD operations for Matrix

  getCell(row, col) {
    return this.matrix[row][col];
  }

  updateCell(row, col, value, stickyNoteId) {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.columns) {
      this.setCell(row, col, value, stickyNoteId);
      return true;
    }
    return false;
  }

  deleteCell(row, col) {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.columns) {
      this.matrix[row][col] = null;

      // Remove sticky note ID from the row map
      const stickyNotes = this.rowToStickyNotesMap.get(row);
      if (stickyNotes) {
        const index = stickyNotes.findIndex(
          (id) => id === this.matrix[row][col]?.stickyNoteId,
        );
        if (index !== -1) {
          stickyNotes.splice(index, 1);
        }
      }

      return true;
    }
    return false;
  }

  addRow() {
    this.matrix.push(Array(this.columns).fill(null));
    this.rows++;
  }

  removeRow(rowIndex) {
    if (rowIndex >= 0 && rowIndex < this.rows) {
      this.matrix.splice(rowIndex, 1);
      this.rows--;
      this.rowToStickyNotesMap.delete(rowIndex);
      return true;
    }
    return false;
  }
  setRowName(rowIndex, name) {
    if (rowIndex >= 0 && rowIndex < this.rows) {
      if (!this.rowNames) {
        this.rowNames = new Map();
      }
      this.rowNames.set(rowIndex, name);
      return true;
    }
    return false;
  }

  getRowName(rowIndex) {
    if (this.rowNames && rowIndex >= 0 && rowIndex < this.rows) {
      return this.rowNames.get(rowIndex);
    }
    return null;
  }

  setColumnName(colIndex, name) {
    if (colIndex >= 0 && colIndex < this.columns) {
      if (!this.columnNames) {
        this.columnNames = new Map();
      }
      this.columnNames.set(colIndex, name);
      return true;
    }
    return false;
  }

  getColumnName(colIndex) {
    if (this.columnNames && colIndex >= 0 && colIndex < this.columns) {
      return this.columnNames.get(colIndex);
    }
    return null;
  }

  removeColumn(colIndex) {
    if (colIndex >= 0 && colIndex < this.columns) {
      for (let i = 0; i < this.rows; i++) {
        this.matrix[i].splice(colIndex, 1);
      }
      this.columns--;
      this.columnToFrameMap.delete(colIndex);
      return true;
    }
    return false;
  }
  updateRowName(rowIndex, newName) {
    if (rowIndex >= 0 && rowIndex < this.rows) {
      if (!this.rowNames) {
        this.rowNames = new Map();
      }
      this.rowNames.set(rowIndex, newName);
      return true;
    }
    return false;
  }

  updateColumnName(colIndex, newName) {
    if (colIndex >= 0 && colIndex < this.columns) {
      if (!this.columnNames) {
        this.columnNames = new Map();
      }
      this.columnNames.set(colIndex, newName);
      return true;
    }
    return false;
  }

  deleteRowName(rowIndex) {
    if (this.rowNames && rowIndex >= 0 && rowIndex < this.rows) {
      return this.rowNames.delete(rowIndex);
    }
    return false;
  }

  deleteColumnName(colIndex) {
    if (this.columnNames && colIndex >= 0 && colIndex < this.columns) {
      return this.columnNames.delete(colIndex);
    }
    return false;
  }

  getAllRowNames() {
    return this.rowNames ? Object.fromEntries(this.rowNames) : {};
  }

  getAllColumnNames() {
    return this.columnNames ? Object.fromEntries(this.columnNames) : {};
  }

  async addColumn() {
    const newColumnIndex = this.columns;
    this.columns++;

    // Create a new frame for the column
    const frame = await board.createFrame({
      title: `Column ${newColumnIndex}`,
      width: 1920, // 1080p width
      height: 1080, // 1080p height
    });

    // Link the new column to the frame
    this.linkColumnToFrame(newColumnIndex, frame.id);

    // Add a new cell to each row and create a sticky note for it
    for (let i = 0; i < this.rows; i++) {
      if (!this.matrix[i]) {
        this.matrix[i] = [];
      }
      const sticky = await board.createStickyNote({
        content: "",
        x: frame.x,
        y: frame.y + i * 100, // Adjust vertical position for each sticky note
        width: 200,
      });
      this.matrix[i][newColumnIndex] = { value: 0, stickyNoteId: sticky.id };
    }

    // Update column names if necessary
    if (this.columnNames) {
      this.updateColumnName(newColumnIndex, `Column ${newColumnIndex}`);
    }

    return newColumnIndex;
  }

  // Additional methods to manage the matrix, rows, and columns can be added here
}

//////////////////////////////////////////////////////////////////////////////////////////////////
// Example usage:
// const matrix = new Matrix(3, 3);
//
// // Set cell values and link sticky notes
// matrix.setCell(0, 0, 5, 'stickyNote1');
// matrix.setCell(0, 1, 3, 'stickyNote2');
// matrix.setCell(1, 0, 2, 'stickyNote3');
// matrix.setCell(2, 2, 4, 'stickyNote4');
//
// // Link columns to frames
// matrix.linkColumnToFrame(0, 'frame1');
// matrix.linkColumnToFrame(1, 'frame2');
// matrix.linkColumnToFrame(2, 'frame3');
//
// // Get sticky notes for a row
// console.log(matrix.getStickyNotesForRow(0)); // ['stickyNote1', 'stickyNote2']
//
// // Get frame for a column
// console.log(matrix.getFrameForColumn(0)); // 'frame1'
//
// // Add a new row
// matrix.addRow();
// console.log(matrix.rows); // 4
//
// // Add a new column
// matrix.addColumn();
// console.log(matrix.columns); // 4
//
// // Update row and column names
// matrix.updateRowName(0, 'First Row');
// matrix.updateColumnName(1, 'Second Column');
//
// // Get all row and column names
// console.log(matrix.getAllRowNames());
// console.log(matrix.getAllColumnNames());
//
// matrix.linkColumnToFrame(0, 'frame1');
//
// console.log(matrix.getStickyNotesForRow(0)); // ['stickyNote1', 'stickyNote2']
// console.log(matrix.getFrameForColumn(0)); // 'frame1'
//////////////////////////////////////////////////////////////////////////////////////////////////

class Trait {
  constructor(stickyNotesIds, content = "", tags = []) {
    this.stickyNotesIds = stickyNotesIds;
    this.content = content;
    this.tags = tags;
  }

  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  removeTag(tag) {
    const index = this.tags.indexOf(tag);
    if (index !== -1) {
      this.tags.splice(index, 1);
    }
  }

  setContent(content) {
    this.content = content;
  }
}

async function createBenefitTraitMatrix(benefits, traits) {
  const matrix = [];

  // Create rows for each benefit
  for (let i = 0; i < benefits; i++) {
    // Create a new frame with 1080 16:9 aspect ratio
    const newFrame = await board.createFrame({
      title: `Benefit ${i + 1}`,
      x: i * 1100, // Offset each frame horizontally
      y: 0,
      width: 1080,
      height: 608,
    });
    console.log(`Created frame ${newFrame.id}`);
    const row = [];

    // Create cells for each trait
    for (let j = 0; j < traits; j++) {
      // create a new sticky note and place it in the new frame
      const newStickyNote = await board.createStickyNote({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        content: `Trait ${j + 1}`,
        frameId: newFrame.id,
      });
      // create a new trait from the new sticky note and place it in the row
      const newTrait = new Trait([newStickyNote.id], `Trait ${j + 1}`);
      row.push(newTrait);
    }

    matrix.push(row);
  }

  return matrix;
}

// Example usage:
// const benefitTraitMatrix = createBenefitTraitMatrix(benefits, traits);
async function createMatrix() {
  console.log("Create Matrix button clicked");

  // Get the number of rows and columns from the input fields
  const rowsCount = parseInt(document.getElementById("rowsCount").value, 10);
  const columnsCount = parseInt(
    document.getElementById("columnsCount").value,
    10,
  );

  // Validate the input
  if (
    isNaN(rowsCount) ||
    isNaN(columnsCount) ||
    rowsCount < 1 ||
    columnsCount < 1
  ) {
    alert("Please enter valid numbers for rows and columns.");
    return;
  }

  // Create the matrix
  const matrix = new Matrix(rowsCount, columnsCount);

  // Create frames for each column
  for (let j = 0; j < columnsCount; j++) {
    const frame = await board.createFrame({
      title: `Column ${j + 1}`,
      width: 1920,
      height: 1080,
      x: j * 2000, // Offset each frame horizontally
      y: 0,
      style: {
        fillColor: "#ffffff", // Set background color to white
      },
    });
    matrix.linkColumnToFrame(j, frame.id);
  }
  console.log("Matrix created: 366", matrix);

  // Create sticky notes for each cell in each column
  for (let j = 0; j < columnsCount; j++) {
    const frameId = matrix.getFrameForColumn(j);
    const frame = await board.getById(frameId);
    //safa here
    const squarePositions = calculateBestSquaresInRectangle(
      frame.width,
      frame.height,
      rowsCount,
    );

    console.log("Square Positions:", squarePositions);
    //
    //   // Calculate the upper-left corner of the frame
    const frameLeft = frame.x - frame.width / 2;
    const frameTop = frame.y - frame.height / 2;
    //
    //
    //   // Create sticky notes
    //   const createdNotes = [];
    //   for (let i = 0; i < noOfSquares; i++) {
    //     const row = Math.floor(i / squarePositions.gridInfo.columns);
    //     const col = i % squarePositions.gridInfo.columns;
    //     const position = squarePositions.placement.getSquarePosition(row, col);
    //
    //     const stickyNote = await board.createStickyNote({
    //       x : frameLeft + position.x + squarePositions.gridInfo.effectiveSquareSize / 2,
    //       y: frameTop + position.y + squarePositions.gridInfo.effectiveSquareSize / 2,
    //       width: squarePositions.gridInfo.effectiveSquareSize,
    //       style: {
    //         fillColor: "light_yellow",
    //       }
    //     });

    // safa here

    // Calculate optimal sticky note size
    // const stickyNoteSize = calculateStickyNoteSize(frame.width, frame.height, rowsCount, columnsCount);
    // const offsetSize = stickyNoteSize * 0.15;

    for (let i = 0; i < rowsCount; i++) {
      const row = Math.floor(i / squarePositions.gridInfo.columns);
      const col = i % squarePositions.gridInfo.columns;
      const position = squarePositions.placement.getSquarePosition(row, col);

      const stickyNote = await board.createStickyNote({
        content: `Cell ${i + 1},${j + 1}`,
        x:
          frameLeft +
          position.x +
          squarePositions.gridInfo.effectiveSquareSize / 2,
        y:
          frameTop +
          position.y +
          squarePositions.gridInfo.effectiveSquareSize / 2,
        width: squarePositions.gridInfo.effectiveSquareSize,
        style: {
          fillColor: "light_yellow",
        },
      });
      // const stickyNote = await miro.board.createStickyNote({
      //   content: `Cell ${i + 1},${j + 1}`,
      //   x: frame.x + (j * (stickyNoteSize + offsetSize)) + stickyNoteSize / 2,
      //   y: frame.y + (i * (stickyNoteSize + offsetSize)) + stickyNoteSize / 2,
      //   width: stickyNoteSize,
      // });
      await frame.add(stickyNote);

      matrix.setCell(
        i,
        j,
        new Trait([stickyNote.id], `Cell ${i + 1},${j + 1}`),
      );
    }
  }

  console.log("Matrix created:", matrix);
  return matrix;
}

document.getElementById("createMatrix").addEventListener("click", createMatrix);

document.getElementById("debugButton").addEventListener("click", async () => {
  console.log("Debug button clicked");
  //call the createBenefitTraitMatrix function with 10 benefits and 10 traits
  const benefitTraitMatrix = await createBenefitTraitMatrix(10, 10);
  console.log(benefitTraitMatrix);
});
//
// document.getElementById("createPair").addEventListener("click", async () => {
//
//   const pairId = `pair_${Date.now()}`; // Unique pair identifier based on timestamp
//
//   const frames = await board.get({ type: "frame" });
//   if (frames.length === 0) {
//     alert("No frames found on the board. Please create a frame first.");
//     return;
//   }
//
//   // Read the number of squares from the input field
//   let noOfSquares = parseInt(
//     document.getElementById("traitsCount").value,
//     10,
//   );
//
//   // Validate the input
//   if (isNaN(noOfSquares) || noOfSquares < 1 || noOfSquares > 200) {
//     alert("Please enter a valid number of squares between 1 and 200.");
//     return;
//   }
//
//   noOfSquares = noOfSquares * 2;
//   const frame = await findFrameByName("Benefit Template");
//   const targetFrame = frame;
//   const frameDimensions = await getFrameDimensions(frame);
//   const squarePositions = calculateBestSquaresInRectangle(
//     frameDimensions.width,
//     frameDimensions.height,
//     noOfSquares,
//   );
//   console.log("Square Positions:", squarePositions);
//
//   // Calculate the upper-left corner of the frame
//   const frameLeft = targetFrame.x - targetFrame.width / 2;
//   const frameTop = targetFrame.y - targetFrame.height / 2;
//
//
//   // Create sticky notes
//   const createdNotes = [];
//   for (let i = 0; i < noOfSquares; i++) {
//     const row = Math.floor(i / squarePositions.gridInfo.columns);
//     const col = i % squarePositions.gridInfo.columns;
//     const position = squarePositions.placement.getSquarePosition(row, col);
//
//     const stickyNote = await board.createStickyNote({
//       x : frameLeft + position.x + squarePositions.gridInfo.effectiveSquareSize / 2,
//       y: frameTop + position.y + squarePositions.gridInfo.effectiveSquareSize / 2,
//       width: squarePositions.gridInfo.effectiveSquareSize,
//       style: {
//         fillColor: "light_yellow",
//       }
//     });
//
//     createdNotes.push(stickyNote);
//   }
//
//   // Link sticky notes in pairs and update content
//   for (let i = 0; i < createdNotes.length; i += 2) {
//     const sticky1 = createdNotes[i];
//     const sticky2 = createdNotes[i + 1];
//
//     await sticky1.setMetadata('myApp', { itsPair: sticky2.id });
//     await sticky2.setMetadata('myApp', { itsPair: sticky1.id });
//
//
//     sticky1.content = `ID: ${sticky1.id}\nPair ID: ${sticky2.id}\nPair: ${Math.floor(i/2) + 1} of ${noOfSquares/2}`;
//     await sticky1.sync();
//
//     sticky2.content = `ID: ${sticky2.id}\nPair ID: ${sticky1.id}\nPair: ${Math.floor(i/2) + 1} of ${noOfSquares/2}`;
//     await sticky2.sync();
//   }
//
//   console.log(`Created ${noOfSquares} sticky notes for pair ${pairId}`);
// });

// Add this listener after your existing code
board.ui.on("selection:update", async (event) => {
  const selectedItems = event.items;

  for (const item of selectedItems) {
    if (item.type === "sticky_note") {
      const metadata = await item.getMetadata("myApp");
      console.log(`Metadata for sticky note ${item.id}:`, metadata);
      console.log(`Tags for sticky note ${item.id}:`, item.tagIds);
    }
  }
});

// ... rest of your code ...

// const originalSizes = new Map(); // Store original sizes for each sticky note
// const resizedStickyNotes = new Set(); // Store the IDs of resized sticky notes

// // Function to double the size of a sticky note
// async function doubleSize(stickyNote) {
//   const { width, height } = stickyNote;
//
//   // Save the original size if not already saved
//   if (!originalSizes.has(stickyNote.id)) {
//     originalSizes.set(stickyNote.id, { width, height });
//   }
//   stickyNote.width = width * 2;
//   stickyNote.sync();
//
//   resizedStickyNotes.add(stickyNote.id); // Track resized sticky note
// }

// // Function to reset the sticky note size to its original size
// async function resetSize(stickyNote) {
//   const originalSize = originalSizes.get(stickyNote.id);
//   if (originalSize) {
//
//   stickyNote.width = originalSize.width;
//   stickyNote.sync();
//   //stickyNote.height= originalSize.height;
//   //stickyNote.sync();
//
//     // Remove from the resized sticky notes set and the original size map
//     resizedStickyNotes.delete(stickyNote.id);
//     originalSizes.delete(stickyNote.id);
//   }
// }

// Event listener for selection changes
// miro.board.ui.on('selection:update', async (event) => {
//   const selectedWidgets = event.items;
//
//   for (const widget of selectedWidgets) {
//     if (widget.type === 'sticky_note') {
//       // Get the metadata of the selected sticky note
//       const metadata = await widget.getMetadata('myApp');
//
//       // Check if the sticky note has a pairId
//       if (metadata && metadata.pairId && metadata.pairedNoteId) {
//         const pairedNoteId = metadata.pairedNoteId;
//
//         // Double the size of the selected sticky note
//         await doubleSize(widget);
//
//         // Find the paired sticky note and double its size
//         const [pairedNote] = await miro.board.widgets.get({ id: pairedNoteId });
//         if (pairedNote) {
//           await doubleSize(pairedNote);
//         }
//       } else {
//         // If the sticky note doesn't have a pair, just resize the selected one
//         await doubleSize(widget);
//       }
//     }
//   }
//
//   // Handle unselected sticky notes by restoring their original size
//   const allStickyNotes = await miro.board.widgets.get({ type: 'sticky_note' });
//   const unselectedStickyNotes = allStickyNotes.filter(
//     (stickyNote) => !selectedWidgets.some((selected) => selected.id === stickyNote.id)
//   );
//
//   for (const stickyNote of unselectedStickyNotes) {
//     if (resizedStickyNotes.has(stickyNote.id)) {
//       await resetSize(stickyNote);
//     }
//   }
// });

function calculateBestSquaresInRectangle(
  rectangleWidth,
  rectangleHeight,
  numSquares,
  margin = 0.1,
) {
  // Compute ratio of the rectangle
  var ratio = rectangleWidth / rectangleHeight;

  // Initial estimates for number of columns and rows
  var ncols_float = Math.sqrt(numSquares * ratio);
  var nrows_float = numSquares / ncols_float;

  // Find the best option for filling the whole height
  var nrows1 = Math.ceil(nrows_float);
  var ncols1 = Math.ceil(numSquares / nrows1);
  while (nrows1 * ratio < ncols1) {
    nrows1++;
    ncols1 = Math.ceil(numSquares / nrows1);
  }
  var cell_size1 = rectangleHeight / nrows1;

  // Find the best option for filling the whole width
  var ncols2 = Math.ceil(ncols_float);
  var nrows2 = Math.ceil(numSquares / ncols2);
  while (ncols2 < nrows2 * ratio) {
    ncols2++;
    nrows2 = Math.ceil(numSquares / ncols2);
  }
  var cell_size2 = rectangleWidth / ncols2;

  // Determine the best configuration
  var nrows, ncols, cell_size;
  if (cell_size1 < cell_size2) {
    nrows = nrows2;
    ncols = ncols2;
    cell_size = cell_size2;
  } else {
    nrows = nrows1;
    ncols = ncols1;
    cell_size = cell_size1;
  }

  // Calculate effective cell size including margin
  const effectiveCellSize = cell_size * (1 - margin);

  // Calculate usable area within the rectangle
  const usableWidth = ncols * effectiveCellSize;
  const usableHeight = nrows * effectiveCellSize;

  // Calculate offset to center the grid in the rectangle
  const offsetX = (rectangleWidth - usableWidth) / 2;
  const offsetY = (rectangleHeight - usableHeight) / 2;

  return {
    gridInfo: {
      columns: ncols,
      rows: nrows,
      squareSize: cell_size,
      margin: margin,
      effectiveSquareSize: effectiveCellSize,
    },
    rectangleInfo: {
      width: rectangleWidth,
      height: rectangleHeight,
      usableWidth: usableWidth,
      usableHeight: usableHeight,
    },
    placement: {
      offsetX: offsetX,
      offsetY: offsetY,
      getSquarePosition: (row, col) => ({
        x: offsetX + col * effectiveCellSize,
        y: offsetY + row * effectiveCellSize,
      }),
    },
    totalSquares: nrows * ncols,
  };
}

// function calculateOptimalLayout(frameWidth, frameHeight, totalSquares) {
//     let bestSize = 0;
//     let bestRows = 0;
//     let bestColumns = 0;

//     // Try different column counts (must be even)
//     for (let columns = 2; columns <= Math.sqrt(totalSquares) * 2; columns += 2) {
//         const rows = Math.ceil(totalSquares / columns);
//         const sizeByWidth = frameWidth / (columns * 1.15);
//         const sizeByHeight = frameHeight / (rows * 1.15);
//         const size = Math.min(sizeByWidth, sizeByHeight);

//         if (size > bestSize) {
//             bestSize = size;
//             bestRows = rows;
//             bestColumns = columns;
//         }
//     }

//     return {
//         stickyNoteSize: bestSize,
//         rows: bestRows,
//         columns: bestColumns
//     };
// }

// Usage in your main function
// async function createPairMatrix(rowsCount, columnsCount) {
//     const frame = await board.createFrame({
//         title: 'Pair Matrix',
//         width: 1920,
//         height: 1080
//     });

//     const totalSquares = rowsCount * columnsCount;
//     const layout = calculateOptimalLayout(frame.width, frame.height, totalSquares);

//     const matrix = new Matrix(rowsCount, columnsCount);
//     const offsetSize = layout.stickyNoteSize * 0.15;

//     for (let i = 0; i < rowsCount; i++) {
//         for (let j = 0; j < columnsCount; j++) {
//             const stickyNote = await board.createStickyNote({
//                 content: `Cell ${i + 1},${j + 1}`,
//                 x: frame.x + (j % layout.columns) * (layout.stickyNoteSize + offsetSize) + layout.stickyNoteSize / 2,
//                 y: frame.y + Math.floor(j / layout.columns) * (layout.stickyNoteSize + offsetSize) + layout.stickyNoteSize / 2,
//                 width: layout.stickyNoteSize,
//             });
//             await frame.add(stickyNote);

//             matrix.setCell(i, j, 0, stickyNote.id);
//         }
//     }

//     // Rest of your function...
// }
