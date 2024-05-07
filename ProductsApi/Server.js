import App from "./Api/App.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { PORT } from "./Api/Config/index.js";


export const __dirname = dirname(fileURLToPath(import.meta.url));

App.listen(PORT, () => {
  console.log("====== SERVER IS RUNNING ======");
  console.log(`====== PORT: ${PORT}     ======`);
  console.log("===============================");
});