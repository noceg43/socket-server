import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import * as redis from '../../src/utils/redis';
import { Room } from '../../src/models/room';
import { User } from '../../src/models/user';
import { JoinState, FillState } from 'wth_logic';

describe('Redis Persistence Integration', () => {
  const roomId = 'test-room-1';
  const userA = new User({ id: 'A', name: 'User A' });

  before(async () => {
    // Ensure redis is connected
    if (!redis.redisClient.isOpen) {
      await redis.redisClient.connect();
    }
    try {
        await redis.redisClient.flushAll();
    } catch (e) {
        // flushAll might fail if not connected, but we checked isOpen
    }
  });

  after(async () => {
    if (redis.redisClient.isOpen) {
        await redis.redisClient.quit();
    }
  });

  test('Should save and load a room in JoinState', async () => {
    const room = Room.create(roomId);
    await redis.saveRoom(room);

    const loadedRoom = await redis.getRoom(roomId);
    assert.ok(loadedRoom);
    assert.strictEqual(loadedRoom.id, roomId);
    assert.ok(loadedRoom.logicRoom.state instanceof JoinState);
  });

  test('Should persist users after joining', async () => {
    // Re-connect if needed (redis.ts might have a side-effecting connection)
    if (!redis.redisClient.isOpen) await redis.redisClient.connect();

    await redis.joinRoom(roomId, userA);

    const loadedRoom = await redis.getRoom(roomId);
    assert.ok(loadedRoom);
    const user = loadedRoom.logicRoom.getUser('A');
    assert.ok(user);
    assert.strictEqual(user.name, 'User A');
  });

  test('Should persist FillState and Map data (takes)', async () => {
    if (!redis.redisClient.isOpen) await redis.redisClient.connect();

    const room = await redis.getRoom(roomId);
    assert.ok(room);

    // Transition to FillState manually for testing persistence
    room.logicRoom.transitionTo(new FillState());

    // Add some takes
    room.logicRoom.processEvent({ type: 'add', payload: { id: 'A', text: 'Take 1' } });

    await redis.saveRoom(room);

    const loadedRoom = await redis.getRoom(roomId);
    assert.ok(loadedRoom);
    assert.ok(loadedRoom.logicRoom.state instanceof FillState);

    // Check if takes Map was preserved
    const takes = (loadedRoom.logicRoom.state as any).takes;
    assert.ok(takes instanceof Map);
    assert.strictEqual(takes.get('A')[0], 'Take 1');
  });
});
