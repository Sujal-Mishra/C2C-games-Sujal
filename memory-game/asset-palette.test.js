import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";

const CARD_ASSETS = [
  "Shark.png", "Jellyfish.png", "Fish.png", "ConeShell.png",
  "Snail.png", "Conch.png", "Turtle.png", "Seahorse.png",
  "Seagrass.png", "MantaRay.png", "Whale.png", "Coral.png",
];

const EXPECTED_COLORS = new Set(["b44f76", "ffffff"]);

function paeth(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const diagonalDistance = Math.abs(estimate - upperLeft);
  return leftDistance <= aboveDistance && leftDistance <= diagonalDistance
    ? left
    : aboveDistance <= diagonalDistance ? above : upperLeft;
}

function decodeRgbaPng(buffer) {
  const idat = [];
  let width;
  let height;
  for (let offset = 8; offset < buffer.length;) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      assert.equal(data[8], 8, "card PNGs must use 8-bit channels");
      assert.equal(data[9], 6, "card PNGs must be RGBA");
    } else if (type === "IDAT") {
      idat.push(data);
    }
    offset += length + 12;
  }

  const compressed = inflateSync(Buffer.concat(idat));
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const pixels = Buffer.alloc(stride * height);
  let sourceOffset = 0;

  for (let row = 0; row < height; row += 1) {
    const filter = compressed[sourceOffset++];
    for (let column = 0; column < stride; column += 1) {
      const raw = compressed[sourceOffset++];
      const index = row * stride + column;
      const left = column >= bytesPerPixel ? pixels[index - bytesPerPixel] : 0;
      const above = row > 0 ? pixels[index - stride] : 0;
      const upperLeft = row > 0 && column >= bytesPerPixel ? pixels[index - stride - bytesPerPixel] : 0;
      const predictor = filter === 0 ? 0
        : filter === 1 ? left
        : filter === 2 ? above
        : filter === 3 ? Math.floor((left + above) / 2)
        : filter === 4 ? paeth(left, above, upperLeft)
        : assert.fail(`unsupported PNG filter ${filter}`);
      pixels[index] = (raw + predictor) & 255;
    }
  }
  return pixels;
}

test("every marine card uses only logo dark pink and white", async () => {
  for (const asset of CARD_ASSETS) {
    const pixels = decodeRgbaPng(await readFile(`assets/${asset}`));
    const colors = new Set();
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] === 0) continue;
      colors.add(pixels.subarray(index, index + 3).toString("hex"));
    }
    assert.deepEqual(colors, EXPECTED_COLORS, asset);
  }
});

test("the cookie back uses the logo dark pink", async () => {
  const cookie = await readFile("assets/cookie-card.svg", "utf8");
  assert.match(cookie, /fill="#B44F76"/);
});
