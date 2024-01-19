import { init } from "./index";

describe("init test", () => {
  it("console.func() should work with logger", () => {
    init();
    console.debug("hello");
    console.info("hello");
    console.warn("hello");
    console.error("hello");
    expect(true).toBe(true);
  });
});
