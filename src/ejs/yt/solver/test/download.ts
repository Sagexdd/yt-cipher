import { players, tests } from "./tests.js";
import { downloadCached } from "./utils.js";

for (const test of tests) {
  const variants = test.variants ?? players.keys();
  for (const variant of variants) {
    try {
      await downloadCached(test.player, variant);
    } catch (e) {
      console.error(e);
    }
  }
}
