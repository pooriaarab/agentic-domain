// src/version.ts
import { createRequire } from "module";
var VERSION = true ? "0.1.0" : readPackageVersion();

export {
  VERSION
};
