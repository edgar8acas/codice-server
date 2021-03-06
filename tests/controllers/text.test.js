import supertest from "supertest";
import app from "./../../server.js";
import test from "ava";
import path from "path";
import {
  insertTexts,
  cleanupDatabase,
  insertTextsWithContent,
} from "./../helpers/initialization.js";

test.before("prepare database", async (t) => {
  t.context.agent = supertest(app);
});

test.afterEach.always("cleanup", async () => {
  await cleanupDatabase();
});

test.skip("should save a new text", async (t) => {
  const text = require("./../fixtures/texts.json")[0];

  const res = await t.context.agent.post("/api/texts").send(text);

  const { body, statusCode } = res;
  t.is(statusCode, 201);
  t.is(body.title, text.title);
});

test.skip("should save raw content of an existing text", async (t) => {
  const text = require("./../fixtures/texts.json")[0];
  const saved = await insertTexts([text]);

  const res = await t.context.agent
    .post("/api/texts/:id/content")
    .attach("rawContent", path.resolve(__dirname, "../data/aeropuerto.txt"))
    .field("textId", saved[0].textId);

  const { body, statusCode } = res;
  t.is(statusCode, 200);
  t.truthy(body.rawContent);
});

test.skip("should get single text from database", async (t) => {
  const text = require("./../fixtures/texts.json")[0];
  const saved = await insertTexts([text]);

  const res = await t.context.agent.get(`/api/texts/${saved[0].textId}`);

  const { body, statusCode } = res;
  t.is(statusCode, 200);
  t.is(body.textId, saved[0].textId);
});

test.skip("should get all texts from database", async (t) => {
  const texts = require("./../fixtures/texts.json").slice(0, 3);
  const saved = await insertTexts(texts);

  const res = await t.context.agent.get("/api/texts");

  const { body, statusCode } = res;
  t.is(statusCode, 200);
  t.is(body.length, saved.length);
});

test.serial("should go through the steps to process a new text", async (t) => {
  const toSave = require("./../fixtures/texts.json").slice(4, 7);
  const texts = await insertTextsWithContent(toSave);

  // Process texts
  const processed = await t.context.agent.post(
    `/api/texts/${texts[0].textId}/process`
  );

  const { body: toChoose, statusCode } = processed;
  const expectedToChoose = {
    ...require("./../fixtures/words.json")["wordsToChoose1"],
    textId: String(texts[0].textId),
  };

  t.deepEqual(toChoose, expectedToChoose);
  t.is(statusCode, 200);

  const finalResponse = await t.context.agent
    .post(`/api/texts/${texts[0].textId}/process/save`)
    .send(toChoose);

  const { body: saved, statusCode: statusCode2 } = finalResponse;
  t.is(saved.length, Object.keys(expectedToChoose.ready).length);
  t.is(statusCode2, 200);
});
