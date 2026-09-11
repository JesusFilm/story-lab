import test from 'node:test';
import assert from 'node:assert/strict';
import {registerMazeTools} from '../web/tools.mjs';
import {generate} from '../src/index.mjs';
test('optional agent tools register, generate, read back, and reject bad inputs',async()=>{
  const registered=new Map();let current=null;
  const cleanup=registerMazeTools({registerTool(tool){registered.set(tool.name,tool);}},{generate(config){current=generate(config);return {passed:current.passed,seed:current.maze.config.seed};},read(){return {seed:current?.maze.config.seed};}});
  assert.equal(registered.size,2);const create=registered.get('generate_maze'),read=registered.get('read_maze_report');
  assert.equal(read.annotations.readOnlyHint,true);assert.equal(create.annotations.readOnlyHint,false);
  assert.deepEqual(await create.execute({config:{seed:'agent-contract'}}),{passed:true,seed:'agent-contract'});
  assert.deepEqual(read.execute({}),{seed:'agent-contract'});
  await assert.rejects(create.execute({config:{columns:-1}}));await assert.rejects(create.execute({config:[]}));assert.throws(()=>read.execute({unknown:true}));assert.equal(read.execute({}).seed,'agent-contract');
  cleanup();assert.equal(registerMazeTools(undefined,{}),undefined);
});
