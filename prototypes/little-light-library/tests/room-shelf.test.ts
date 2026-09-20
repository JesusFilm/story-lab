import assert from "node:assert/strict";
import test from "node:test";
import {
  roomShelfLayout,
  roomToyLayout,
  shelfTransferPose,
} from "../src/room-shelf";

test("six shelf books fit the cabinet in packed-left slots", () => {
  const layout = roomShelfLayout(6);
  assert.equal(layout.slots.length, 6);
  assert.equal(layout.endStopX, null);
  assert.ok(layout.slots[0].x - 0.33 > -2.96);
  assert.ok(layout.slots.at(-1)!.x + 0.33 < 2.96);
  assert.deepEqual(
    layout.slots.map((slot) => Number(slot.x.toFixed(2))),
    [-2.38, -1.59, -0.8, -0.01, 0.78, 1.57],
  );
});

test("an underfilled shelf places its bookend immediately after the last book", () => {
  const layout = roomShelfLayout(3);
  assert.equal(layout.slots.length, 3);
  assert.equal(Number(layout.endStopX!.toFixed(3)), -0.405);
  assert.ok(layout.endStopX! > layout.slots.at(-1)!.x + 0.33);
  assert.equal(roomShelfLayout(0).endStopX, null);
  assert.equal(roomShelfLayout(20).slots.length, 6);
});

test("the landing proxy matches the closed table book footprint and hinge offset", () => {
  const pose = shelfTransferPose();
  assert.equal(Number((0.66 * pose.scale.x).toFixed(3)), 3.13);
  assert.equal(Number((1.24 * pose.scale.y).toFixed(3)), 3.6);
  assert.equal(Number((0.16 * pose.scale.z).toFixed(3)), 0.4);
  assert.equal(pose.position.x, 1.56);
  assert.equal(pose.position.y, 1.39);
  assert.equal(pose.rotationX, -Math.PI / 2);
});

test("generic toys occupy the lower shelf without reaching the book shelf", () => {
  const toys = roomToyLayout(9);
  assert.equal(toys.length, 4);
  assert.deepEqual(
    toys.map((toy) => Number(toy.x.toFixed(2))),
    [-1.08, -0.36, 0.36, 1.08],
  );
  assert.ok(toys.every((toy) => toy.y >= 1.27 && toy.y + 1.02 < 2.92));
});
