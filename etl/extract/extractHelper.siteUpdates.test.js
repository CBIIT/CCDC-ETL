import { describe, expect, it, vi } from "vitest";
import extractHelper from "./extractHelper";

const release = {
  logType: 1,
  title: "New release",
  version: "1.5.9",
  postDate: "2026-06-10",
  contentType: "Clinical",
  description: "New resources",
  details: "<p>Details</p>",
  status: 1,
};

const createConnection = ({ failInsertAt = 0 } = {}) => {
  const state = {
    rows: [{ title: "Existing release" }],
    transactionRows: null,
  };
  let insertCount = 0;
  const connection = {
    beginTransaction: vi.fn((callback) => {
      state.transactionRows = state.rows.map((row) => ({ ...row }));
      callback(null);
    }),
    query: vi.fn((sql, values, callback) => {
      if (typeof values === "function") {
        callback = values;
      }
      if (sql.startsWith("delete")) {
        state.transactionRows = [];
        callback(null, {});
      } else if (++insertCount === failInsertAt) {
        callback(new Error("forced insert failure"));
      } else {
        state.transactionRows.push({ title: values[1] });
        callback(null, { insertId: 1 });
      }
    }),
    commit: vi.fn((callback) => {
      state.rows = state.transactionRows;
      state.transactionRows = null;
      callback(null);
    }),
    rollback: vi.fn((callback) => {
      state.transactionRows = null;
      callback(null);
    }),
    release: vi.fn(),
  };
  return { connection, state };
};

describe("transactional changelog replacement", () => {
  it("deletes and inserts all rows in one committed transaction", async () => {
    const { connection, state } = createConnection();
    const database = {
      getConnectionAsync: vi.fn().mockResolvedValue(connection),
    };

    await extractHelper.replaceSiteChangeLogs([release], database);

    expect(state.rows).toEqual([{ title: "New release" }]);
    expect(connection.commit).toHaveBeenCalledOnce();
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledOnce();
  });

  it("rolls back deletion and partial writes when an insert fails", async () => {
    const { connection, state } = createConnection({ failInsertAt: 2 });
    const database = {
      getConnectionAsync: vi.fn().mockResolvedValue(connection),
    };
    const secondRelease = {
      ...release,
      title: "Second release",
      version: "1.5.8",
    };

    await expect(extractHelper.replaceSiteChangeLogs([release, secondRelease], database))
      .rejects.toThrow("forced insert failure");

    expect(state.rows).toEqual([{ title: "Existing release" }]);
    expect(connection.query).toHaveBeenCalledTimes(3);
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalledOnce();
    expect(connection.release).toHaveBeenCalledOnce();
  });
});
