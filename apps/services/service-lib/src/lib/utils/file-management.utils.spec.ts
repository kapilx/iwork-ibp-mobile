import * as fs from "fs";
import * as os from "os";
import * as path from "path";
// node-qpdf2 is ESM and this jest config cannot parse it; the password-protection
// path it backs is not exercised here.
jest.mock("node-qpdf2", () => ({}));

import { saveFileToStorage } from "./file-management.utils";

const makeFile = (originalname: string) =>
  ({
    originalname,
    buffer: Buffer.from("x"),
    mimetype: "application/pdf",
  }) as Express.Multer.File;

describe("saveFileToStorage key uniqueness", () => {
  let docRepoPath: string;

  beforeEach(() => {
    docRepoPath = fs.mkdtempSync(path.join(os.tmpdir(), "file-mgmt-"));
  });

  afterEach(() => {
    fs.rmSync(docRepoPath, { recursive: true, force: true });
  });

  const save = (name: string) =>
    saveFileToStorage(makeFile(name), "opportunity", {
      repoMode: "LFS",
      docRepoPath,
    });

  it("gives two uploads of the same filename different keys", async () => {
    const a = await save("report.pdf");
    const b = await save("report.pdf");
    expect(a.key).not.toBe(b.key);
  });

  it("keeps the basename clean so fileKey.split('/').pop() stays displayable", async () => {
    const { key, fileName } = await save("report.pdf");
    expect(key.split("/").pop()).toBe("report.pdf");
    expect(fileName).toBe("report.pdf");
  });

  it("strips whitespace from the original name", async () => {
    const { fileName } = await save("my report copy.pdf");
    expect(fileName).toBe("myreportcopy.pdf");
  });
});
